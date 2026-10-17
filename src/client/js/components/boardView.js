/**
 * boardView.js
 * 
 * Execution Board (Kanban / Column View).
 * A distinct, modern PM Execution Command Center featuring 3 structured columns:
 * 1. ⚠️ Needs PM Review & Ambiguity Resolution
 * 2. ✅ Verified Action Items (Ready for Jira / Linear)
 * 3. 🎯 Ratified Decisions & Active Blockers
 * 
 * Includes 1-click owner assignment popovers, interactive checkboxes,
 * and contextual evidence inspection.
 */

import { store } from '../state/store.js';

export function renderBoardView(container) {
  const state = store.getState();
  const { actionItems, decisions, openQuestions, parsedTranscript, highlightedEvidence } = state;
  const speakers = parsedTranscript.speakers || ['Aarav', 'Rohan', 'Priya', 'Vikram'];

  // Categorize items
  const needsReviewItems = actionItems.filter(i => i.needsHumanReview || i.status === 'pending_review');
  const approvedActions = actionItems.filter(i => !i.needsHumanReview && i.status === 'approved');
  const unapprovedDecisions = decisions.filter(d => !d.approved);
  const confirmedDecisions = decisions.filter(d => d.approved);
  const unresolvedQuestions = openQuestions.filter(q => q.status === 'open');

  container.innerHTML = `
    <div class="board-container">
      <!-- Column 1: Needs PM Attention & Ambiguities -->
      <div class="board-column column-needs-review">
        <div class="board-column-header">
          <div class="column-title-group">
            <span class="column-status-dot dot-warning"></span>
            <span class="column-title">Needs Attention</span>
            <span class="column-count">${needsReviewItems.length}</span>
          </div>
          <span class="column-subtitle">Missing owners, fuzzy dates & unverified</span>
        </div>

        <div class="board-column-body">
          ${needsReviewItems.length === 0 ? `
            <div class="column-empty-state">
              <span style="font-size: 20px;">🎉</span>
              <p style="font-weight: 600; color: #34d399;">All items audited!</p>
              <p style="font-size: 11px; color: var(--text-tertiary);">Zero unassigned tasks or ambiguous timelines remaining.</p>
            </div>
          ` : needsReviewItems.map(item => renderBoardActionCard(item, speakers, true, highlightedEvidence)).join('')}
        </div>
      </div>

      <!-- Column 2: Verified Execution Commitments -->
      <div class="board-column column-approved">
        <div class="board-column-header">
          <div class="column-title-group">
            <span class="column-status-dot dot-success"></span>
            <span class="column-title">Execution Ready</span>
            <span class="column-count">${approvedActions.length}</span>
          </div>
          <span class="column-subtitle">Explicit owners & deadlines verified</span>
        </div>

        <div class="board-column-body">
          ${approvedActions.length === 0 ? `
            <div class="column-empty-state">
              <span style="font-size: 18px;">⏳</span>
              <p style="font-weight: 500; color: var(--text-secondary);">No approved tasks yet.</p>
              <p style="font-size: 11px; color: var(--text-tertiary);">Approve items from the left column to queue them for export.</p>
            </div>
          ` : approvedActions.map(item => renderBoardActionCard(item, speakers, false, highlightedEvidence)).join('')}
        </div>
      </div>

      <!-- Column 3: Decisions & Open Blockers -->
      <div class="board-column column-decisions">
        <div class="board-column-header">
          <div class="column-title-group">
            <span class="column-status-dot dot-info"></span>
            <span class="column-title">Decisions & Blockers</span>
            <span class="column-count">${decisions.length + unresolvedQuestions.length}</span>
          </div>
          <span class="column-subtitle">Team consensus & active questions</span>
        </div>

        <div class="board-column-body">
          <!-- Decisions Section -->
          <div style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;">
            Confirmed Decisions (${confirmedDecisions.length})
          </div>
          ${decisions.map(d => renderBoardDecisionCard(d, highlightedEvidence)).join('')}

          <!-- Blockers Section -->
          <div style="font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin: 16px 0 6px;">
            Open Questions & Blockers (${unresolvedQuestions.length})
          </div>
          ${openQuestions.map(q => renderBoardQuestionCard(q, highlightedEvidence)).join('')}
        </div>
      </div>
    </div>
  `;

  bindBoardEvents(container, speakers);
}

function renderBoardActionCard(item, speakers, isPending, highlighted) {
  const isSelected = highlighted && highlighted.itemId === item.id;
  const isUnassigned = !item.assignee || item.assignee === 'Unassigned';

  return `
    <div class="board-card ${isPending ? 'card-pending' : 'card-approved'} ${isSelected ? 'card-selected' : ''}" id="board-card-${item.id}">
      <!-- Card Top: Checkbox, ID, Priority -->
      <div class="card-top">
        <div class="card-top-left">
          <button class="checkbox-btn ${item.status === 'approved' ? 'checked' : ''}" data-action="toggle-approve" data-id="${item.id}" title="Toggle approval">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <span class="badge-id">${item.id}</span>
          <span class="badge-priority priority-${item.priority || 'medium'}">${(item.priority || 'medium').toUpperCase()}</span>
        </div>

        <span class="confidence-indicator" title="Extraction Confidence">${Math.round((item.confidenceScore || 0.85) * 100)}%</span>
      </div>

      <!-- Title -->
      <div class="board-card-title">${escapeHtml(item.title)}</div>

      <!-- Quick Owner Assign & Deadline -->
      <div class="card-metadata-row" style="margin-left: 0; margin-top: 4px;">
        ${isUnassigned ? `
          <div class="quick-assign-wrapper" style="position: relative;">
            <select class="quick-assign-select" data-action="select-owner" data-id="${item.id}" title="Assign meeting participant">
              <option value="">⚠️ Assign Owner...</option>
              ${speakers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}
            </select>
          </div>
        ` : `
          <div class="meta-pill">
            <span class="speaker-avatar" style="width: 15px; height: 15px; font-size: 8px;">${(item.assignee || 'U').charAt(0)}</span>
            <span>${escapeHtml(item.assignee)}</span>
          </div>
        `}

        <div class="meta-pill ${!item.deadline ? 'meta-pill-warning' : ''}">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${item.deadline ? escapeHtml(item.deadline) : 'No due date'}</span>
        </div>
      </div>

      <!-- Ambiguity Warning if present -->
      ${(item.ambiguityFlags || []).map(f => `
        <div class="board-ambiguity-tag">
          <span>⚠️ ${escapeHtml(f.label)}:</span> ${escapeHtml(f.message)}
        </div>
      `).join('')}

      <!-- Citation Snippet & Quick View -->
      <div class="board-card-quote">
        <span class="quote-text">"${escapeHtml(item.evidenceQuote)}"</span>
        <button class="btn-board-jump" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}" title="Inspect in transcript">
          L${item.evidenceLine || 1} ↗
        </button>
      </div>
    </div>
  `;
}

function renderBoardDecisionCard(item, highlighted) {
  const isSelected = highlighted && highlighted.itemId === item.id;
  const isConfirmed = item.decisionType === 'confirmed';

  return `
    <div class="board-card card-decision ${isSelected ? 'card-selected' : ''}" id="board-card-${item.id}">
      <div class="card-top">
        <div class="card-top-left">
          <button class="checkbox-btn ${item.approved ? 'checked' : ''}" data-action="toggle-decision" data-id="${item.id}" title="Toggle ratified sign-off">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <span class="badge-id">${item.id}</span>
          <span class="badge-type badge-type-decision">${isConfirmed ? 'CONFIRMED' : 'PROPOSED'}</span>
        </div>
      </div>

      <div class="board-card-title">${escapeHtml(item.statement)}</div>

      <div class="card-metadata-row" style="margin-left: 0; margin-top: 4px;">
        <span style="font-size: 11px; color: var(--text-tertiary);">
          Decision Maker: <strong style="color: var(--text-secondary);">${escapeHtml(item.decisionMaker || 'Consensus')}</strong>
        </span>
      </div>

      <div class="board-card-quote">
        <span class="quote-text">"${escapeHtml(item.evidenceQuote)}"</span>
        <button class="btn-board-jump" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
          L${item.evidenceLine || 1} ↗
        </button>
      </div>
    </div>
  `;
}

function renderBoardQuestionCard(item, highlighted) {
  const isSelected = highlighted && highlighted.itemId === item.id;
  const isResolved = item.status === 'resolved';

  return `
    <div class="board-card card-question ${isSelected ? 'card-selected' : ''}" id="board-card-${item.id}">
      <div class="card-top">
        <div class="card-top-left">
          <button class="checkbox-btn ${isResolved ? 'checked' : ''}" data-action="toggle-question" data-id="${item.id}" title="Mark resolved">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <span class="badge-id">${item.id}</span>
          <span class="badge-type badge-type-question">${isResolved ? 'RESOLVED' : 'BLOCKER'}</span>
        </div>
      </div>

      <div class="board-card-title" style="color: #fda4af;">${escapeHtml(item.question)}</div>

      <div class="card-metadata-row" style="margin-left: 0; margin-top: 4px;">
        <span style="font-size: 11px; color: var(--text-tertiary);">
          Raised by: ${escapeHtml(item.raisedBy || 'Team')} ${item.addressedTo ? `· To: <strong>${escapeHtml(item.addressedTo)}</strong>` : ''}
        </span>
      </div>

      <div class="board-card-quote">
        <span class="quote-text">"${escapeHtml(item.evidenceQuote)}"</span>
        <button class="btn-board-jump" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
          L${item.evidenceLine || 1} ↗
        </button>
      </div>
    </div>
  `;
}

function bindBoardEvents(container, speakers) {
  // Toggle action item approval
  container.querySelectorAll('[data-action="toggle-approve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-id');
      const item = store.getState().actionItems.find(i => i.id === id);
      if (item) {
        if (item.status === 'approved') {
          item.status = 'pending_review';
          item.needsHumanReview = true;
          store.notify();
        } else {
          store.approveActionItem(id);
        }
      }
    });
  });

  // Quick Owner Select on board card
  container.querySelectorAll('[data-action="select-owner"]').forEach(select => {
    select.addEventListener('change', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const owner = e.target.value;
      if (owner) {
        store.assignOwner(id, owner);
      }
    });
  });

  // Toggle decision signoff
  container.querySelectorAll('[data-action="toggle-decision"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-id');
      store.toggleDecisionApproval(id);
    });
  });

  // Toggle question resolution
  container.querySelectorAll('[data-action="toggle-question"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = e.currentTarget.getAttribute('data-id');
      store.toggleQuestionResolved(id);
    });
  });

  // Jump to transcript citation
  container.querySelectorAll('.btn-board-jump').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const line = parseInt(e.currentTarget.getAttribute('data-line'), 10);
      const quote = e.currentTarget.getAttribute('data-quote');
      const id = e.currentTarget.getAttribute('data-id');
      store.setEvidenceHighlight(line, quote, id);
      // Switch to split audit studio view to highlight the exact line
      store.setView('split');
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
