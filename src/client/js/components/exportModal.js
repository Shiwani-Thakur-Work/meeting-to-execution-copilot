/**
 * exportModal.js
 * 
 * Multi-Format Execution Outcome Exporter.
 * Generates:
 * 1. Markdown Checklist (GitHub Issues / PR descriptions / Notion)
 * 2. RFC 4180 CSV (Jira, Linear, Asana, Excel)
 * 3. Structured JSON payload for automated pipelines
 * 
 * Supports both one-click clipboard copying and file downloads.
 */

import { store } from '../state/store.js';
import { openModal, closeModal, showToast } from './modals.js';

export function setupExportModal(container) {
  const modalEl = document.createElement('div');
  modalEl.className = 'modal-overlay';
  modalEl.id = 'export-modal';

  modalEl.innerHTML = `
    <div class="modal-content" style="max-width: 680px;">
      <div class="modal-header">
        <h3 class="modal-title">Export Execution Outcomes</h3>
        <button class="modal-close-btn" data-close="export-modal">✕</button>
      </div>

      <!-- Export Format Tabs -->
      <div style="display: flex; gap: 8px; padding: 12px 20px 0; border-bottom: 1px solid var(--border-subtle);">
        <button class="btn-tab-toggle active" id="tab-export-md">Markdown Checklist</button>
        <button class="btn-tab-toggle" id="tab-export-csv">CSV Spreadsheet</button>
        <button class="btn-tab-toggle" id="tab-export-json">JSON Payload</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <textarea class="form-textarea" id="export-preview-area" rows="12" style="font-family: var(--font-mono); font-size: 11px; white-space: pre;" readonly></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-icon" data-close="export-modal">Close</button>
        <button class="btn-icon" id="btn-download-file">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span id="download-btn-text">Download CSV</span>
        </button>
        <button class="btn-primary" id="btn-copy-export">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy to Clipboard</span>
        </button>
      </div>
    </div>
  `;

  container.appendChild(modalEl);

  let activeFormat = 'markdown'; // 'markdown' | 'csv' | 'json'

  function updatePreview() {
    const textarea = modalEl.querySelector('#export-preview-area');
    const downloadBtn = modalEl.querySelector('#download-btn-text');
    if (!textarea) return;

    if (activeFormat === 'markdown') {
      textarea.value = generateMarkdown();
      downloadBtn.textContent = 'Download .md';
    } else if (activeFormat === 'csv') {
      textarea.value = generateCSV();
      downloadBtn.textContent = 'Download .csv';
    } else {
      textarea.value = generateJSON();
      downloadBtn.textContent = 'Download .json';
    }
  }

  // Bind Export Modal Open Event
  window.addEventListener('open-export-modal', () => {
    updatePreview();
    openModal('export-modal');
  });

  // Tab switching
  const tabMd = modalEl.querySelector('#tab-export-md');
  const tabCsv = modalEl.querySelector('#tab-export-csv');
  const tabJson = modalEl.querySelector('#tab-export-json');

  function setTab(format, activeBtn) {
    activeFormat = format;
    [tabMd, tabCsv, tabJson].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
    updatePreview();
  }

  tabMd.addEventListener('click', () => setTab('markdown', tabMd));
  tabCsv.addEventListener('click', () => setTab('csv', tabCsv));
  tabJson.addEventListener('click', () => setTab('json', tabJson));

  // Close handlers
  modalEl.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal('export-modal'));
  });

  // Copy button
  const copyBtn = modalEl.querySelector('#btn-copy-export');
  copyBtn.addEventListener('click', async () => {
    const textarea = modalEl.querySelector('#export-preview-area');
    if (textarea) {
      try {
        await navigator.clipboard.writeText(textarea.value);
        showToast('Copied to clipboard!');
      } catch (err) {
        textarea.select();
        document.execCommand('copy');
        showToast('Copied to clipboard!');
      }
    }
  });

  // Download File button
  const downloadBtn = modalEl.querySelector('#btn-download-file');
  downloadBtn.addEventListener('click', () => {
    const textarea = modalEl.querySelector('#export-preview-area');
    const content = textarea.value;
    const dateStr = new Date().toISOString().split('T')[0];

    let filename = `meeting-execution-${dateStr}.md`;
    let mimeType = 'text/markdown';

    if (activeFormat === 'csv') {
      filename = `meeting-actions-${dateStr}.csv`;
      mimeType = 'text/csv;charset=utf-8;';
    } else if (activeFormat === 'json') {
      filename = `meeting-execution-${dateStr}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  });
}

/**
 * Generates an executive Markdown checklist for GitHub/Notion.
 */
function generateMarkdown() {
  const state = store.getState();
  const { actionItems, decisions, openQuestions } = state;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let md = `# Meeting Execution Outcomes — ${dateStr}\n\n`;
  md += `> Audited & verified via **Meeting-to-Execution Copilot**.\n\n`;

  // Decisions
  md += `## 🎯 Confirmed Decisions\n\n`;
  if (!decisions.length) {
    md += `_No decisions recorded._\n\n`;
  } else {
    decisions.forEach(d => {
      const icon = d.approved ? '✅' : '⏳';
      md += `- ${icon} **${d.statement}**\n`;
      md += `  - *Decision Maker:* ${d.decisionMaker || 'Team Consensus'}\n`;
      md += `  - *Evidence:* "${d.evidenceQuote}" (Line ${d.evidenceLine || 1})\n\n`;
    });
  }

  // Action Items
  md += `## 📋 Action Items & Deliverables\n\n`;
  if (!actionItems.length) {
    md += `_No action items recorded._\n\n`;
  } else {
    actionItems.forEach(a => {
      const check = a.status === 'approved' ? '[x]' : '[ ]';
      const owner = a.assignee ? `@${a.assignee}` : '⚠️ **Unassigned**';
      const due = a.deadline ? `(Due: ${a.deadline})` : '⚠️ *(No due date)*';
      const priority = `[${(a.priority || 'medium').toUpperCase()}]`;

      md += `- ${check} ${priority} **${a.title}** — ${owner} ${due}\n`;
      md += `  - *Transcript Citation:* "${a.evidenceQuote}" (Line ${a.evidenceLine || 1})\n`;
      if (a.ambiguityFlags && a.ambiguityFlags.length > 0) {
        a.ambiguityFlags.forEach(f => {
          md += `  - ⚠️ *Ambiguity Note:* ${f.message}\n`;
        });
      }
      md += `\n`;
    });
  }

  // Open Questions & Blockers
  md += `## ❓ Open Questions & Blockers\n\n`;
  if (!openQuestions.length) {
    md += `_No open questions._\n\n`;
  } else {
    openQuestions.forEach(q => {
      const statusIcon = q.status === 'resolved' ? '✓' : '⚠️ BLOCKER:';
      md += `- ${statusIcon} **${q.question}**\n`;
      md += `  - *Raised by:* ${q.raisedBy || 'Team'} | *Directed to:* ${q.addressedTo || 'Unspecified'}\n\n`;
    });
  }

  return md;
}

/**
 * Generates an RFC 4180 standard CSV.
 */
function generateCSV() {
  const state = store.getState();
  const headers = ['ID', 'Type', 'Title', 'Assignee', 'Deadline', 'Priority', 'Status', 'Confidence', 'EvidenceQuote'];

  const rows = [headers.join(',')];

  function escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  state.actionItems.forEach(item => {
    rows.push([
      escapeCsv(item.id),
      escapeCsv('Action Item'),
      escapeCsv(item.title),
      escapeCsv(item.assignee || 'Unassigned'),
      escapeCsv(item.deadline || 'Unspecified'),
      escapeCsv(item.priority || 'medium'),
      escapeCsv(item.status),
      escapeCsv(`${Math.round((item.confidenceScore || 0.85) * 100)}%`),
      escapeCsv(item.evidenceQuote)
    ].join(','));
  });

  state.decisions.forEach(item => {
    rows.push([
      escapeCsv(item.id),
      escapeCsv('Decision'),
      escapeCsv(item.statement),
      escapeCsv(item.decisionMaker || 'Team'),
      escapeCsv('N/A'),
      escapeCsv(item.decisionType === 'confirmed' ? 'high' : 'medium'),
      escapeCsv(item.approved ? 'ratified' : 'pending'),
      escapeCsv('100%'),
      escapeCsv(item.evidenceQuote)
    ].join(','));
  });

  state.openQuestions.forEach(item => {
    rows.push([
      escapeCsv(item.id),
      escapeCsv('Open Question'),
      escapeCsv(item.question),
      escapeCsv(item.addressedTo || 'Team'),
      escapeCsv('N/A'),
      escapeCsv('high'),
      escapeCsv(item.status),
      escapeCsv('100%'),
      escapeCsv(item.evidenceQuote)
    ].join(','));
  });

  return rows.join('\r\n');
}

/**
 * Generates structured JSON export.
 */
function generateJSON() {
  const state = store.getState();
  return JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      generator: 'Meeting-to-Execution Copilot',
      version: '1.0.0',
      totalActionItems: state.actionItems.length,
      totalDecisions: state.decisions.length,
      totalOpenQuestions: state.openQuestions.length
    },
    actionItems: state.actionItems,
    decisions: state.decisions,
    openQuestions: state.openQuestions
  }, null, 2);
}
