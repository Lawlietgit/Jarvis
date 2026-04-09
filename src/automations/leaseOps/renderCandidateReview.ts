import type { LeaseCandidateDiscoveryReport, ReviewCandidate } from './types.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

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

function renderCandidateCard(candidate: ReviewCandidate): string {
  return `<article class="card">
    <div class="row">
      <div>
        <p class="eyebrow">${escapeHtml(candidate.propertyId)}</p>
        <h3>${escapeHtml(candidate.address)}</h3>
        <p class="meta">${escapeHtml(candidate.tenantName)} • ${escapeHtml(candidate.source)}</p>
      </div>
      <span class="badge">Pending review</span>
    </div>
    <div class="stats">
      <div><span>Lease end</span><strong>${escapeHtml(candidate.leaseEnd ?? 'unknown')}</strong></div>
      <div><span>Rent</span><strong>${escapeHtml(formatCurrency(candidate.monthlyRent))}</strong></div>
      <div><span>Confidence</span><strong>${candidate.confidence.toFixed(2)}</strong></div>
    </div>
    <p class="reason">${escapeHtml(candidate.reason)}</p>
    <p><strong>Suggested import path:</strong> ${escapeHtml(candidate.suggestedImportPath)}</p>
    <ul>${candidate.evidence.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>
  </article>`;
}

export function renderCandidateReviewConsole(report: LeaseCandidateDiscoveryReport): string {
  const lines = [
    `Candidate discovery generated at ${report.generatedAt}`,
    `Approved docs: ${report.overview.approvedDocuments} | Pending: ${report.overview.pendingCandidates} | Skipped covered: ${report.overview.skippedCovered}`,
    ''
  ];

  for (const candidate of report.pendingCandidates) {
    lines.push(
      `${candidate.address} | ${candidate.source} | lease end ${candidate.leaseEnd ?? 'unknown'} | confidence ${candidate.confidence.toFixed(2)}`
    );
    lines.push(`  Reason: ${candidate.reason}`);
    lines.push(`  Import: ${candidate.suggestedImportPath}`);
  }

  if (report.pendingCandidates.length === 0) {
    lines.push('No new candidate lease files need review.');
  }

  return lines.join('\n');
}

export function renderCandidateReviewHtml(report: LeaseCandidateDiscoveryReport): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lease Candidate Review</title>
    <style>
      :root {
        --bg: #eef2f0;
        --panel: rgba(255, 255, 255, 0.85);
        --ink: #192027;
        --muted: #5e6872;
        --border: rgba(24, 32, 39, 0.1);
        --accent: #0b6f77;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(11, 111, 119, 0.12), transparent 30%),
          linear-gradient(180deg, #f5f8f6 0%, var(--bg) 100%);
      }
      main {
        width: min(1080px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 36px 0 48px;
      }
      .summary,
      .card {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
      }
      .summary {
        padding: 18px 20px;
        margin-bottom: 20px;
      }
      .grid {
        display: grid;
        gap: 16px;
      }
      .card {
        padding: 20px;
        box-shadow: 0 12px 30px rgba(26, 49, 52, 0.08);
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: start;
      }
      .eyebrow, .meta, .stats span {
        color: var(--muted);
      }
      .badge {
        background: var(--accent);
        color: white;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }
      .stats strong {
        display: block;
        margin-top: 4px;
      }
      ul {
        margin: 12px 0 0;
        padding-left: 18px;
        line-height: 1.5;
      }
      @media (max-width: 700px) {
        .row { flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="summary">
        <p class="eyebrow">Jarvis / LeaseOps</p>
        <h1>Candidate lease review</h1>
        <p>Generated at ${escapeHtml(report.generatedAt)}. These are likely signed lease files that are not yet represented in the synced folder.</p>
        <p>Approved docs: ${report.overview.approvedDocuments} | Pending: ${report.overview.pendingCandidates} | Skipped covered: ${report.overview.skippedCovered}</p>
      </section>
      <section class="grid">
        ${report.pendingCandidates.length > 0 ? report.pendingCandidates.map((candidate) => renderCandidateCard(candidate)).join('') : '<article class="card"><h3>No new candidates</h3><p>Every address is already covered by an approved current lease or no likely signed lease was found.</p></article>'}
      </section>
    </main>
  </body>
</html>`;
}
