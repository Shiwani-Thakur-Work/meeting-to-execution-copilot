/**
 * executionCards.js
 * 
 * Right Pane: Execution Cards & Human-in-the-Loop Review Center.
 * Designed with Linear-style minimalist precision, interactive checkboxes for
 * 1-click approvals, tasteful editorial ambiguity banners, and clean citation links.
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

    const totalCount = actionItems.length + decisions.length + openQuestions.length;
    const ambiguityCount = [...actionItems, ...decisions].filter(i => i.ambiguityFlags && i.ambiguityFlags.length > 0).length;

    container.innerHTML = `
      <div class="pane pane-workbench">
        <!-- Workbench Controls Header -->
        <div class="workbench-header">
          <!-- Segmented Control Tabs -->
          <div class="filter-tabs">
            <button class="tab-btn ${activeFilterTab === 'all' && !ambiguityFilterOnly ? 'active' : ''}" data-tab="all">
              <span>All</span>
              <span class="tab-badge">${totalCount}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'actions' ? 'active' : ''}" data-tab="actions">
              <span>Actions</span>
              <span class="tab-badge">${actionItems.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'decisions' ? 'active' : ''}" data-tab="decisions">
              <span>Decisions</span>
              <span class="tab-badge">${decisions.length}</span>
            </button>
            <button class="tab-btn ${activeFilterTab === 'questions' ? 'active' : ''}" data-tab="questions">
              <span>Questions</span>
              <span class="tab-badge">${openQuestions.length}</span>
            </button>
          </div>

          <!-- Quick Action Controls -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <!-- Ambiguity Filter Toggle -->
            <button class="btn-ambiguity-filter ${ambiguityFilterOnly ? 'active' : ''}" id="btn-toggle-ambiguities" title="Show only items with missing owners or vague dates">
              <span>⚠️ Ambiguities</span>
              <span style="font-family: var(--font-mono); font-size: 10px;">(${ambiguityCount})</span>
            </button>

            <!-- Add Item Button -->
            <button class="btn-icon" id="btn-add-item-modal" title="Add manual action or decision">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>New</span>
            </button>
          </div>
        </div>

        <!-- Cards List Scroll Area -->
        <div class="cards-scroll-area" id="cards-container">
          ${visibleItems.length === 0 ? `
            <div style="text-align: center; color: var(--text-tertiary); padding: 50px 20px;">
              <p style="font-size: 13.5px; font-weight: 500; margin-bottom: 4px; color: var(--text-secondary);">No items in this view.</p>
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
    const isUnassigned = !item.assignee || item.assignee === 'Unassigned';

    return `
      <div class="execution-card ${isApproved ? 'status-approved' : 'status-pending'}" id="card-${item.id}" style="${isSelected ? 'border-color: #3b82f6; box-shadow: 0 0 16px rgba(59, 130, 246, 0.35);' : ''}">
        <!-- Card Top Bar with Checkbox & Tags -->
        <div class="card-top">
          <div class="card-top-left">
            <!-- 1-Click Interactive Checkbox -->
            <button class="checkbox-btn ${isApproved ? 'checked' : ''}" data-action="toggle-approve" data-id="${item.id}" title="${isApproved ? 'Approved (click to toggle)' : 'Click to approve'}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <span class="badge-id">${item.id}</span>
            <span class="badge-type badge-type-action">Action</span>
            <span class="badge-priority priority-${item.priority || 'medium'}">${(item.priority || 'medium').toUpperCase()}</span>
          </div>

          <div class="confidence-indicator" title="Language certainty confidence">
            <span>${Math.round((item.confidenceScore || 0.85) * 100)}%</span>
          </div>
        </div>

        <!-- Task Title -->
        <div class="card-title">${escapeHtml(item.title)}</div>

        <!-- Metadata: Assignee & Deadline -->
        <div class="card-metadata-row">
          <!-- Assignee -->
          <div class="meta-pill ${isUnassigned ? 'meta-pill-warning' : ''}" ${isUnassigned ? `data-action="quick-assign" data-id="${item.id}" title="Click to assign owner"` : ''}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${isUnassigned ? '⚠️ Unassigned (Assign)' : escapeHtml(item.assignee)}</span>
          </div>

          <!-- Deadline -->
          <div class="meta-pill ${!item.deadline ? 'meta-pill-warning' : ''}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>${item.deadline ? escapeHtml(item.deadline) : '⚠️ No Due Date'}</span>
          </div>
        </div>

        <!-- Editorial Ambiguity Callouts -->
        ${(item.ambiguityFlags || []).map(flag => `
          <div class="ambiguity-banner">
            <div class="ambiguity-banner-title">
              <span>⚠️</span>
              <span>${escapeHtml(flag.label)}</span>
            </div>
            <div class="ambiguity-banner-desc">${escapeHtml(flag.message)}</div>
            <div class="ambiguity-banner-rec">Recommendation: ${escapeHtml(flag.recommendation)}</div>
          </div>
        `).join('')}

        <!-- Source Evidence Citation -->
        <div class="evidence-quote-box">
          <div class="evidence-header">
            <span class="evidence-label">Transcript Citation</span>
            <button class="btn-jump-evidence" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Jump to Line ${item.evidenceLine || 1}</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <!-- Card Actions Bar -->
        <div class="card-actions-bar">
          <button class="btn-card-action" data-action="edit" data-id="${item.id}" title="Edit task details">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
    `;
  }

  function renderDecisionCard(item, isSelected) {
    const isConfirmed = item.decisionType === 'confirmed';
    return `
      <div class="execution-card status-approved" id="card-${item.id}" style="${isSelected ? 'border-color: #3b82f6;' : ''}">
        <div class="card-top">
          <div class="card-top-left">
            <button class="checkbox-btn ${item.approved ? 'checked' : ''}" data-action="toggle-decision" data-id="${item.id}" title="Toggle decision sign-off">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
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
            <span>Ratified by: <strong>${escapeHtml(item.decisionMaker || 'Team Consensus')}</strong></span>
          </div>
          <div class="meta-pill" style="color: #34d399;">
            <span>${item.approved ? '✓ Ratified' : '⏳ Needs Sign-off'}</span>
          </div>
        </div>

        <div class="evidence-quote-box">
          <div class="evidence-header">
            <span class="evidence-label">Decision Quote</span>
            <button class="btn-jump-evidence" data-line="${item.evidenceLine}" data-quote="${escapeHtml(item.evidenceQuote)}" data-id="${item.id}">
              <span>Jump to Line ${item.evidenceLine || 1}</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <div class="card-actions-bar">
          <button class="btn-card-action btn-card-delete" data-action="delete" data-id="${item.id}">✕</button>
        </div>
      </div>
    `;
  }

  function renderQuestionCard(item, isSelected) {
    const isResolved = item.status === 'resolved';
    return `
      <div class="execution-card" id="card-${item.id}" style="${isSelected ? 'border-color: #3b82f6;' : ''}">
        <div class="card-top">
          <div class="card-top-left">
            <button class="checkbox-btn ${isResolved ? 'checked' : ''}" data-action="toggle-question" data-id="${item.id}" title="Toggle question resolution">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <span class="badge-id">${item.id}</span>
            <span class="badge-type badge-type-question">Question</span>
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
              <span>Jump to Line ${item.evidenceLine || 1}</span>
            </button>
          </div>
          <div class="evidence-text">"${escapeHtml(item.evidenceQuote)}"</div>
        </div>

        <div class="card-actions-bar">
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
        if (store.getState().ambiguityFilterOnly) {
          store.toggleAmbiguityFilter();
        }
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

    // 1-Click Interactive Checkbox Approval
    container.querySelectorAll('[data-action="toggle-approve"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
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

    // Quick Assign Trigger on Unassigned Pill
    container.querySelectorAll('[data-action="quick-assign"]').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.dispatchEvent(new CustomEvent('open-edit-modal', { detail: { itemId: id } }));
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
        window.dispatchEvent(new CustomEvent('open-edit-modal', { detail: { itemId: id } }));
      });
    });

    // Add manual item modal trigger
    const addBtn = container.querySelector('#btn-add-item-modal');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('open-add-modal'));
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
