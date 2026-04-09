import { renderJarvisShell } from '../shell/renderJarvisShell.js';
import { summarizePropertyManagerWorkspace } from './summarizeWorkspace.js';
import type {
  DocumentReviewStatus,
  LeaseExtensionStatus,
  PropertyManagerWorkspace,
  PropertyWorkspaceRecord,
  RentPaymentStatus
} from './types.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function statusTone(status: RentPaymentStatus | LeaseExtensionStatus | DocumentReviewStatus): string {
  if (status === 'unpaid' || status === 'awaiting_decision' || status === 'needs_review') {
    return 'critical';
  }

  if (status === 'partial' || status === 'review_ready' || status === 'inbox') {
    return 'warning';
  }

  return 'stable';
}

function badge(label: string, tone: string): string {
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function renderPropertyCard(property: PropertyWorkspaceRecord): string {
  return `<article class="property-card panel">
    <div class="property-head">
      <div>
        <p class="eyebrow">${escapeHtml(property.propertyId)}</p>
        <h3>${escapeHtml(property.label)}</h3>
        <p class="muted">${escapeHtml(property.address)} • ${escapeHtml(property.tenantName)}</p>
      </div>
      <div class="badge-stack">
        ${badge(property.rentLedger.status, statusTone(property.rentLedger.status))}
        ${badge(property.extensionPlan.status.replaceAll('_', ' '), statusTone(property.extensionPlan.status))}
      </div>
    </div>
    <div class="stats-grid">
      <div><span>Lease</span><strong>${escapeHtml(property.currentLease.leaseEnd)}</strong></div>
      <div><span>Rent</span><strong>${escapeHtml(formatCurrency(property.currentLease.monthlyRent))}</strong></div>
      <div><span>Paid</span><strong>${escapeHtml(formatCurrency(property.rentLedger.amountPaid))}</strong></div>
      <div><span>Due</span><strong>${escapeHtml(formatCurrency(property.rentLedger.amountDue))}</strong></div>
    </div>
    <div class="detail-grid">
      <section>
        <h4>Lease document</h4>
        <p><strong>${escapeHtml(property.currentLease.fileName)}</strong></p>
        <p class="muted">${escapeHtml(property.currentLease.storagePath)}</p>
        <p class="muted">Confidence ${property.currentLease.extractionConfidence.toFixed(2)} • analyzed ${escapeHtml(property.currentLease.analyzedAt)}</p>
      </section>
      <section>
        <h4>Manual rent entry</h4>
        <p>${escapeHtml(property.rentLedger.currentMonth)}: ${escapeHtml(property.rentLedger.status)}</p>
        <p class="muted">${escapeHtml(property.rentLedger.note ?? 'No note recorded.')}</p>
      </section>
      <section>
        <h4>Extension studio</h4>
        <p>${escapeHtml(property.extensionPlan.rationale)}</p>
        <p class="muted">${property.extensionPlan.targetTermMonths ? `${property.extensionPlan.targetTermMonths} months at ${formatCurrency(property.extensionPlan.recommendedMonthlyRent ?? property.currentLease.monthlyRent)}` : 'No draft parameters yet.'}</p>
      </section>
    </div>
  </article>`;
}

export function renderPropertyManagerDashboard(
  workspace: PropertyManagerWorkspace,
  now: Date
): string {
  const summary = summarizePropertyManagerWorkspace(workspace, now);

  const content = `<style>
      .summary-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 14px;
        margin-bottom: 22px;
      }
      .summary-card, .property-card, .table-panel {
        padding: 18px 20px;
      }
      .summary-card strong {
        display: block;
        margin-top: 8px;
        font-size: 1.9rem;
        font-family: Georgia, "Iowan Old Style", serif;
      }
      .summary-card span, .muted, .eyebrow, .stats-grid span, table th {
        color: #67666d;
      }
      .workspace-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
        gap: 18px;
      }
      .property-list {
        display: grid;
        gap: 16px;
      }
      .property-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: start;
      }
      .property-head h3, .table-panel h3 {
        margin: 6px 0;
        font-size: 1.55rem;
        font-family: Georgia, "Iowan Old Style", serif;
      }
      .badge-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: end;
      }
      .badge {
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 0.78rem;
        font-weight: 700;
        color: white;
      }
      .badge.stable { background: #2f6d42; }
      .badge.warning { background: #b06b10; }
      .badge.critical { background: #9b2f32; }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
        gap: 12px;
        margin: 18px 0;
      }
      .stats-grid strong {
        display: block;
        margin-top: 4px;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }
      .detail-grid h4 {
        margin: 0 0 8px;
      }
      .side-stack {
        display: grid;
        gap: 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }
      th, td {
        text-align: left;
        padding: 10px 0;
        border-bottom: 1px solid rgba(31, 32, 37, 0.08);
        vertical-align: top;
      }
      @media (max-width: 1080px) {
        .workspace-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 720px) {
        .property-head {
          flex-direction: column;
        }
        .badge-stack {
          justify-content: start;
        }
      }
    </style>
    <section class="summary-strip">
      <div class="summary-card panel"><span>Properties</span><strong>${summary.totalProperties}</strong></div>
      <div class="summary-card panel"><span>Lease Expiring ≤60d</span><strong>${summary.expiringWithin60Days}</strong></div>
      <div class="summary-card panel"><span>Partial or Unpaid</span><strong>${summary.partialOrUnpaid}</strong></div>
      <div class="summary-card panel"><span>Inbox Docs</span><strong>${summary.inboxDocuments}</strong></div>
      <div class="summary-card panel"><span>Drafts Ready</span><strong>${summary.extensionDraftsReady}</strong></div>
      <div class="summary-card panel"><span>Collected / Due</span><strong>${formatCurrency(summary.collectedThisMonth)} / ${formatCurrency(summary.dueThisMonth)}</strong></div>
    </section>
    <section class="workspace-grid">
      <div class="property-list">
        ${workspace.properties.map((property) => renderPropertyCard(property)).join('')}
      </div>
      <div class="side-stack">
        <section class="table-panel panel">
          <h3>Document Vault</h3>
          <p class="muted">Uploaded PDFs live under <strong>${escapeHtml(workspace.storageRoot)}</strong>. Store raw files in the inbox area and approved leases in property folders.</p>
          <table>
            <thead><tr><th>File</th><th>Status</th></tr></thead>
            <tbody>
              ${workspace.documentInbox
                .map(
                  (document) => `<tr>
                    <td>
                      <strong>${escapeHtml(document.fileName)}</strong>
                      <div class="muted">${escapeHtml(document.storagePath)}</div>
                    </td>
                    <td>
                      ${badge(document.reviewStatus.replaceAll('_', ' '), statusTone(document.reviewStatus))}
                      <div class="muted">${escapeHtml(document.extractedSummary)}</div>
                    </td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </section>
        <section class="table-panel panel">
          <h3>Action Queue</h3>
          <table>
            <thead><tr><th>Task</th><th>Status</th></tr></thead>
            <tbody>
              ${workspace.tasks
                .map(
                  (task) => `<tr>
                    <td>
                      <strong>${escapeHtml(task.title)}</strong>
                      <div class="muted">${escapeHtml(task.priority)} priority</div>
                    </td>
                    <td>${escapeHtml(task.status)}</td>
                  </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </section>
      </div>
    </section>`;

  return renderJarvisShell({
    title: workspace.portfolioName,
    subtitle:
      'Local-first portfolio workspace for leases, rent collection, uploaded PDFs, and extension drafting. This shell is shared so jobs and consulting products can later live beside it without a rewrite.',
    eyebrow: `Property Manager • ${workspace.operatorName}`,
    activeHref: '/apps/property-manager',
    navItems: [
      { href: '/apps/property-manager', label: 'Property Manager', state: 'live' },
      { href: '/apps/job-hunter', label: 'Job Hunter', state: 'planning' },
      { href: '/apps/consulting', label: 'Consulting Pipeline', state: 'planning' }
    ],
    content
  });
}
