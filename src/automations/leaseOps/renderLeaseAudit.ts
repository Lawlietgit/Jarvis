import type { LeaseAuditItem, LeaseAuditReport, LeaseAuditStatus } from './types.js';

const statusLabels: Record<LeaseAuditStatus, string> = {
  up_to_date: 'Up to date',
  renewal_in_progress: 'Renewal in progress',
  expiring_soon: 'Expiring soon',
  tracked_by_manager: 'Tracked by manager',
  awaiting_manager_update: 'Awaiting manager update',
  missing_lease: 'Missing lease',
  expired: 'Expired'
};

function formatCurrency(value: number | undefined): string {
  if (value === undefined) {
    return 'n/a';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDays(value: number | undefined): string {
  if (value === undefined) {
    return 'n/a';
  }

  if (value < 0) {
    return `${Math.abs(value)} days past`;
  }

  return `${value} days`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function statusTone(status: LeaseAuditStatus): string {
  if (status === 'expired' || status === 'missing_lease') {
    return 'critical';
  }

  if (status === 'awaiting_manager_update' || status === 'expiring_soon') {
    return 'warning';
  }

  if (status === 'renewal_in_progress') {
    return 'active';
  }

  return 'stable';
}

function renderItemCard(item: LeaseAuditItem): string {
  const emailBlock = item.draftEmail
    ? `<section class="draft">
        <h4>Draft email</h4>
        <p><strong>To:</strong> ${escapeHtml(item.draftEmail.to)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(item.draftEmail.subject)}</p>
        <pre>${escapeHtml(item.draftEmail.body)}</pre>
      </section>`
    : '';

  return `<article class="card">
    <div class="card-header">
      <div>
        <p class="eyebrow">${escapeHtml(item.propertyId)}</p>
        <h3>${escapeHtml(item.address)}</h3>
        <p class="meta">${escapeHtml(item.tenantName)} • ${escapeHtml(item.managementMode)}</p>
      </div>
      <span class="badge ${statusTone(item.status)}">${escapeHtml(statusLabels[item.status])}</span>
    </div>
    <div class="stats">
      <div><span>Lease end</span><strong>${escapeHtml(item.effectiveLeaseEnd ?? 'missing')}</strong></div>
      <div><span>Rent</span><strong>${escapeHtml(formatCurrency(item.effectiveRent))}</strong></div>
      <div><span>Time left</span><strong>${escapeHtml(formatDays(item.daysUntilExpiration))}</strong></div>
      <div><span>Registry</span><strong>${item.registryNeedsUpdate ? 'update needed' : 'in sync'}</strong></div>
    </div>
    <p class="action">${escapeHtml(item.recommendedAction)}</p>
    <ul class="evidence">
      ${item.evidence.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}
    </ul>
    ${emailBlock}
  </article>`;
}

export function renderLeaseAuditConsole(report: LeaseAuditReport): string {
  const lines = [
    `Lease audit generated at ${report.generatedAt}`,
    `Properties: ${report.overview.totalProperties} | Need attention: ${report.overview.needingAttention}`,
    ''
  ];

  for (const item of report.items) {
    lines.push(
      [
        item.address,
        statusLabels[item.status],
        `lease end ${item.effectiveLeaseEnd ?? 'missing'}`,
        `rent ${formatCurrency(item.effectiveRent)}`,
        `days ${formatDays(item.daysUntilExpiration)}`
      ].join(' | ')
    );
    lines.push(`  Action: ${item.recommendedAction}`);
  }

  return lines.join('\n');
}

export function renderLeaseAuditHtml(report: LeaseAuditReport): string {
  const summaryCards = Object.entries(report.overview.statusCounts)
    .map(
      ([status, count]) => `<div class="summary-card">
        <span>${escapeHtml(statusLabels[status as LeaseAuditStatus])}</span>
        <strong>${count}</strong>
      </div>`
    )
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lease Audit Report</title>
    <style>
      :root {
        --bg: #f5f1e8;
        --panel: rgba(255, 250, 242, 0.86);
        --ink: #1f1b18;
        --muted: #6a5f55;
        --border: rgba(52, 43, 34, 0.12);
        --critical: #8d2b2b;
        --warning: #b66a10;
        --active: #125a66;
        --stable: #2d6a3c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Georgia, "Iowan Old Style", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top right, rgba(201, 164, 107, 0.18), transparent 35%),
          linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
      }
      main {
        width: min(1120px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 40px 0 56px;
      }
      header {
        margin-bottom: 24px;
      }
      h1 {
        font-size: clamp(2rem, 4vw, 3.4rem);
        margin: 0;
      }
      .subtitle {
        color: var(--muted);
        max-width: 60ch;
        line-height: 1.5;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin: 24px 0 32px;
      }
      .summary-card,
      .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        backdrop-filter: blur(6px);
      }
      .summary-card {
        padding: 16px 18px;
      }
      .summary-card span,
      .stats span,
      .eyebrow,
      .meta {
        color: var(--muted);
        font-size: 0.92rem;
      }
      .summary-card strong {
        display: block;
        font-size: 1.9rem;
        margin-top: 8px;
      }
      .grid {
        display: grid;
        gap: 16px;
      }
      .card {
        padding: 20px;
        box-shadow: 0 12px 30px rgba(67, 49, 24, 0.08);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }
      .card h3 {
        margin: 6px 0 6px;
        font-size: 1.4rem;
      }
      .badge {
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 0.84rem;
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
      }
      .badge.critical { background: var(--critical); }
      .badge.warning { background: var(--warning); }
      .badge.active { background: var(--active); }
      .badge.stable { background: var(--stable); }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin: 18px 0;
      }
      .stats strong {
        display: block;
        font-size: 1rem;
        margin-top: 4px;
      }
      .action {
        font-size: 1.02rem;
        line-height: 1.5;
      }
      .evidence {
        margin: 0;
        padding-left: 18px;
        line-height: 1.5;
      }
      .draft {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
      }
      pre {
        white-space: pre-wrap;
        background: rgba(248, 242, 232, 0.9);
        padding: 14px;
        border-radius: 14px;
        border: 1px solid var(--border);
        overflow-x: auto;
      }
      @media (max-width: 700px) {
        .card-header {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Jarvis / LeaseOps</p>
        <h1>Lease audit dashboard</h1>
        <p class="subtitle">
          Generated at ${escapeHtml(report.generatedAt)}. This is the low-cost review UI:
          a static report you can inspect before wiring live Gmail and DocuSign access.
        </p>
      </header>
      <section class="summary">${summaryCards}</section>
      <section class="grid">${report.items.map((item) => renderItemCard(item)).join('')}</section>
    </main>
  </body>
</html>`;
}
