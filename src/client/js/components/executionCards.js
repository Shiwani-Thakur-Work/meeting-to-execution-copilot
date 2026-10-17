/**
 * executionCards.js
 * 
 * Right Pane: Execution Cards & Human-in-the-Loop Workbench.
 * Renders categorized Action Items, Confirmed Decisions, and Open Questions.
 * Displays explicit ambiguity badges, confidence indicators, verbatim citations,
 * and provides one-click approval, editing, and deletion controls.
 */

import { store } from '../state/store.js';

export function renderExecutionCards(container) {
  function render() {
    const state = store.getState();
    const { actionItems, decisions, openQuestions, activeFilterTab, ambiguityFilterOnly } = state;

    // Filter items based on active tab and ambiguity flag
    let visibleItems = [];

    if (activeFilterTab === 'all') {
      visibleItems = [...actionItems, ...decisions, ...openQuestions];
    } else if (activeFilterTab === 'actions') {
      visibleItems = [...actionItems];
    } else if (activeFilterTab === 'decisions') {
      visibleItems = [...decisions];
    } else if (activeFilterTab === 'questions') {
      visibleItems = [...openQuestions];
    } else if (activeFilterTab === 'needs_review') {
      visibleItems = [
        ...actionItems.filter((i) => i.needsHumanReview),
        ...decisions.filter((i) => i.needsHumanReview)
      ];
    }

    if (ambiguityFilterOnly) {
      visibleItems = visibleItems.filter((i) => (i.ambiguityFlags && i.ambiguityFlags.length > 0));
    }

    container.innerHTML = `
      <div class="pane pane-workbench">
        <!-- Workbench Controls Header -->
        <div class="workbench-header">
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button class="tab-btn ${activeFilterTab === 'all' ? 'active' : ''}" data-tab="all">
              All <span class="tab-badge">${actionItems.length + decisions.length + openQuestions.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'actions' ? 'active' : ''}" data-tab="actions">
              Actions <span class="tab-badge">${actionItems.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'decisions' ? 'active' : ''}" data-tab="decisions">
              Decisions <span class="tab-badge">${decisions.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'questions' ? 'active' : ''}" data-tab="questions">
              Questions <span class="tab-badge">${openQuestions.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'needs_review' ? 'active' : ''}" data-tab="needs_review">
              Needs Review <span class="tab-badge" style="background-color: rgba(245, 158, 11, 0.3); color: #fcd34d;">
                ${actionItems.filter(i => i.needsHumanReview).length}
              </span>
            </button>
          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <!-- Ambiguity Filter Toggle -->
            <button class="btn-ambiguity-filter ${ambiguityFilterOnly ? 'active' : ''}" id="btn-toggle-ambiguities" title="Filter to items with uncertainty flags">
              <span>⚠️ Ambiguities Only</span>
            </button>

            <!-- Add Item Button -->
            <button class="btn-icon" id="btn-add-item-modal" title="Add manual action or decision">
              <span>+ Add</span>
            </button>

            <!-- Export Outcomes Button -->
            <button class="btn-primary" id="btn-open-export-modal" title="Export to Markdown, CSV, or JSON">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Export</span>
            </button>
          </div>
        </div>

        <!-- Cards List Scroll Area -->
        <div class="cards-scroll-area" id="cards-container">
          ${visibleItems.length === 0 ? `
            <div style="text-align: center; color: var(--text-tertiary); padding: 60px 20px;">
              <p style="font-size: 14px; font-weight: 500; margin-bottom: 6px;">No items match the active filter.</p>
              <p style="font-size: 12px;">Try switching tabs or resetting the ambiguity filter.</p>
            </div>
          ` : visibleItems.map((item) => renderCard(item, state.highlightedEvidence)).join('')}
        </div>
      </div>
    `;

    bindEvents();
  }

  function renderCard(item, highlighted) {
    const isSelected = highlighted && highlighted.itemId === item.id;

    if (item.type === 'action_item') {
      return renderActionCard(item, isSelected);
    } else if (item.type === 'decision') {
      return renderDecisionCard(item, isSelected);
    } else {
      return renderQuestionCard(item, isSelected);
    }
  }

  function renderActionCard(item, isSelected) {
    const isApproved = item.status === 'approved';
    const hasAmbiguity = (item.ambiguityFlags || []).length > 0;
    const isUnassigned = !item.assignee || item.assignee === 'Unassigned';

    return `
      <div class="execution-card ${isApproved ? 'status-approved' : 'status-pending'} ${hasAmbiguity ? 'has-ambiguity' : ''}" id="card-${item.id}" style="${isSelected ? 'border-color: #818cf8; box-shadow: 0 0 14px rgba(99, 102, 241, 0.4);' : ''}">
        <!-- Card Top Bar -->
        <div class="card-top">
          <div class="card-tags">
            <span class="badge-id">${item.id}</span>
            <span class="badge-type badge-type-action">Action Item</span>
            <span class="badge-priority priority-${item.priority || 'medium'}">${(item.priority || 'medium').toUpperCase()}</span>
            ${item.isEdited ? `<span style="font-size: 9px; color: #38bdf8; font-weight: 600;">(Edited)</span>` : ''}
          </div>
          <div class="confidence-indicator" title="Extraction confidence based on language certainty">
            <span>${Math.round((item.confidenceScore || 0.85) * 100)}%</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>

        <!-- Task Title -->
        <div class="card-title">${escapeHtml(item.title)}</div>

        <!-- Metadata: Assignee & Deadline -->
        <div class="card-metadata-row">
          <!-- Assignee -->
          <div class="meta-pill ${isUnassigned ? 'meta-pill-warning' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${isUnassigned ? '⚠️ Unassigned Owner' : escapeHtml(item.assignee)}</span>
          </div>

          <!-- Deadline -->
          <div class="meta-pill ${!item.deadline ? 'meta-pill-warning' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${item.deadline ? escapeHtml(item.deadline) : '⚠️ No Due Date'}</span>
          </div>

          <!-- Status Pill -->
          <div class="meta-pill" style="margin-left: auto; ${isApproved ? 'color: #34d399;' : 'color: #fbbf24;'}">
            <span>${isApproved ? '✓ Approved' : '⏳ Pending PM Review'}</span>
          </div>
        </div>

        <!-- Ambiguity Flags -->
        ${(item.ambiguityFlags || []).map(flag => `
          <div class="ambiguity-banner">
            <div class="ambiguity-banner-title">
              <span>⚠️</span>
              <span>${escapeHtml(flag.label)}</span>
            </div>
            <div class="ambiguity-banner-desc">${escapeHtml(flag.message)}</div>
            <div class="ambiguity-banner-rec">💡 Suggestion: ${escapeHtml(flag.recommendation)}</div>
          </div>
        `).join('')}

        <!-- Source Evidence Citation -->
        <div class="evidence-quote-box">
          <div class="evidence-header">
            <span class="evidence-label">Transcript Citation</span>
            <button class="btn-jump-evidence" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Show in Transcript (L${item.evidenceLine || 1})</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <!-- Action Bar -->
        <div class="card-actions-bar">
          <button class="btn-card-action ${isApproved ? '' : 'btn-card-approve'}" data-action="approve" data-id="${item.id}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${isApproved ? 'Approved ✓' : 'Approve Task'}</span>
          </button>

          <div style="display: flex; gap: 6px;">
            <button class="btn-card-action" data-action="edit" data-id="${item.id}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              <span>Edit</span>
            </button>
            <button class="btn-card-action btn-card-delete" data-action="delete" data-id="${item.id}" title="Remove item">
              ✕
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderDecisionCard(item, isSelected) {
    const isConfirmed = item.decisionType === 'confirmed';
    return `
      <div class="execution-card status-approved" id="card-${item.id}" style="${isSelected ? 'border-color: #818cf8;' : ''}">
        <div class="card-top">
          <div class="card-tags">
            <span class="badge-id">${item.id}</span>
            <span class="badge-type badge-type-decision">Decision</span>
            <span class="badge-priority ${isConfirmed ? 'priority-high' : 'priority-medium'}">
              ${isConfirmed ? 'CONFIRMED' : 'PROPOSED'}
            </span>
          </div>
        </div>

        <div class="card-title">${escapeHtml(item.statement)}</div>

        <div class="card-metadata-row">
          <div class="meta-pill">
            <span>By: <strong>${escapeHtml(item.decisionMaker || 'Team Consensus')}</strong></span>
          </div>
          <div class="meta-pill" style="color: #6ee7b7;">
            <span>${item.approved ? '✅ Ratified' : '⏳ Needs Sign-off'}</span>
          </div>
        </div>

        <div class="evidence-quote-box">
          <div class="evidence-header">
            <span class="evidence-label">Decision Quote</span>
            <button class="btn-jump-evidence" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
              <span>Show in Transcript (L${item.evidenceLine || 1})</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <div class="card-actions-bar">
          <button class="btn-card-action ${item.approved ? '' : 'btn-card-approve'}" data-action="toggle-decision" data-id="${item.id}">
            <span>${item.approved ? 'Ratified ✓' : 'Confirm Decision'}</span>
          </button>
          <button class="btn-card-action btn-card-delete" data-action="delete" data-id="${item.id}">✕</button>
        </div>
      </div>
    `;
  }

  function renderQuestionCard(item, isSelected) {
    const isResolved = item.status === 'resolved';
    return `
      <div class="execution-card" id="card-${item.id}" style="${isSelected ? 'border-color: #818cf8;' : ''}">
        <div class="card-top">
          <div class="card-tags">
            <span class="badge-id">${item.id}</span>
            <span class="badge-type badge-type-question">Open Question</span>
            <span class="badge-priority ${isResolved ? 'priority-low' : 'priority-high'}">
              ${isResolved ? 'RESOLVED' : 'BLOCKER'}
            </span>
          </div>
        </div>

        <div class="card-title" style="color: #fecdd3;">${escapeHtml(item.question)}</div>

        <div class="card-metadata-row">
          <div class="meta-pill">
            <span>Raised by: ${escapeHtml(item.raisedBy || 'Team')}</span>
          </div>
          ${item.addressedTo ? `
            <div class="meta-pill">
              <span>Directed to: <strong>${escapeHtml(item.addressedTo)}</strong></span>
            </div>
          ` : ''}
        </div>

        <div class="evidence-quote-box">
          <div class="evidence-header">
            <span class="evidence-label">Question Quote</span>
            <button class="btn-jump-evidence" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
              <span>Show in Transcript (L${item.evidenceLine || 1})</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <div class="card-actions-bar">
          <button class="btn-card-action" data-action="toggle-question" data-id="${item.id}">
            <span>${isResolved ? 'Marked Resolved ✓' : 'Mark as Resolved'}</span>
          </button>
          <button class="btn-card-action btn-card-delete" data-action="delete" data-id="${item.id}">✕</button>
        </div>
      </div>
    `;
  }

  function bindEvents() {
    // Tab switching
    container.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        store.setFilterTab(tab);
      });
    });

    // Ambiguity filter toggle
    const ambBtn = container.querySelector('#btn-toggle-ambiguities');
    if (ambBtn) {
      ambBtn.addEventListener('click', () => {
        store.toggleAmbiguityFilter();
      });
    }

    // Evidence citation jumps
    container.querySelectorAll('.btn-jump-evidence').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const line = parseInt(e.currentTarget.getAttribute('data-line'), 10);
        const quote = e.currentTarget.getAttribute('data-quote');
        const id = e.currentTarget.getAttribute('data-id');
        store.setEvidenceHighlight(line, quote, id);
      });
    });

    // Approve task
    container.querySelectorAll('[data-action="approve"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        store.approveActionItem(id);
      });
    });

    // Toggle decision
    container.querySelectorAll('[data-action="toggle-decision"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        store.toggleDecisionApproval(id);
      });
    });

    // Toggle question
    container.querySelectorAll('[data-action="toggle-question"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        store.toggleQuestionResolved(id);
      });
    });

    // Delete item
    container.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        store.deleteItem(id);
      });
    });

    // Edit item trigger
    container.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const event = new CustomEvent('open-edit-modal', { detail: { itemId: id } });
        window.dispatchEvent(event);
      });
    });

    // Add manual item modal trigger
    const addBtn = container.querySelector('#btn-add-item-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const event = new CustomEvent('open-add-modal');
        window.dispatchEvent(event);
      });
    }

    // Open export modal trigger
    const exportBtn = container.querySelector('#btn-open-export-modal');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const event = new CustomEvent('open-export-modal');
        window.dispatchEvent(event);
      });
    }
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

  // Initial render & subscription
  render();
  store.subscribe(() => render());
}
