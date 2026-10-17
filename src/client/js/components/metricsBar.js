/**
 * metricsBar.js
 * 
 * Executive Status & Workspace View Switcher.
 * Provides real-time audit readiness calculation, metric indicators,
 * and seamless switching between:
 * - 📋 Execution Board (Kanban / Linear-style)
 * - 🔍 Audit Studio (Side-by-side reading & citation linking)
 * - 📝 Briefing Digest (Executive summary document)
 */

import { store } from '../state/store.js';

export function renderMetricsBar(container) {
  function update() {
    const state = store.getState();
    const metrics = store.getMetrics();
    const currentView = state.currentView || 'board';

    const totalItems = metrics.totalActions + metrics.confirmedDecisions;
    const verifiedItems = metrics.approvedActions + metrics.confirmedDecisions;
    const progressPercent = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 100;

    container.innerHTML = `
      <div class="metrics-strip">
        <!-- Left: Workspace View Switcher Tabs -->
        <div class="view-switcher-bar">
          <button class="btn-view-switcher ${currentView === 'board' ? 'active' : ''}" data-view="board" title="Kanban-style Execution Command Center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="5" height="18" rx="1"></rect>
              <rect x="10" y="3" width="5" height="12" rx="1"></rect>
              <rect x="17" y="3" width="5" height="15" rx="1"></rect>
            </svg>
            <span>Execution Board</span>
          </button>

          <button class="btn-view-switcher ${currentView === 'split' ? 'active' : ''}" data-view="split" title="Side-by-side transcript reader and citation inspector">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="12" y1="3" x2="12" y2="21"></line>
            </svg>
            <span>Audit Studio</span>
          </button>

          <button class="btn-view-switcher ${currentView === 'briefing' ? 'active' : ''}" data-view="briefing" title="Executive meeting briefing and decision digest">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
            </svg>
            <span>Briefing Digest</span>
          </button>
        </div>

        <!-- Center: Audit Readiness Gauge -->
        <div class="audit-progress-container" title="Audit readiness based on approved items and resolved ambiguities">
          <div class="audit-progress-track">
            <div class="audit-progress-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <span class="audit-progress-label">${progressPercent}% Audited</span>
          ${metrics.pendingReviewActions > 0 ? `
            <span style="font-size: 11px; color: var(--text-tertiary);">
              (${metrics.pendingReviewActions} pending verification)
            </span>
          ` : `
            <span style="font-size: 11px; color: #34d399; font-weight: 500;">
              ✓ Ready for export
            </span>
          `}
        </div>

        <!-- Right: Executive Metrics Indicators -->
        <div class="metrics-group">
          <!-- Action Items -->
          <div class="metric-pill" title="Total structured action items">
            <span>Actions:</span>
            <span class="metric-value">${metrics.totalActions}</span>
          </div>

          <!-- Confirmed Decisions -->
          <div class="metric-pill" title="Confirmed decisions ratified by team">
            <span>🎯 Decisions:</span>
            <span class="metric-value" style="color: #34d399;">${metrics.confirmedDecisions}</span>
          </div>

          <!-- Ambiguity Flags -->
          <div class="metric-pill ${metrics.totalAmbiguities > 0 ? 'metric-pill-warning' : ''}" id="metric-ambiguity-trigger" style="cursor: pointer;" title="Items requiring owner or deadline clarification">
            <span>⚠️ Flags:</span>
            <span class="metric-value" style="color: #fbbf24;">${metrics.totalAmbiguities}</span>
          </div>

          <!-- Time Saved -->
          <div class="metric-pill" title="Estimated PM time saved vs manual note scrubbing">
            <span>⚡ Saved:</span>
            <span class="metric-value" style="color: #60a5fa;">~${metrics.minutesSaved}m</span>
          </div>
        </div>
      </div>
    `;

    // Bind view switcher
    container.querySelectorAll('.btn-view-switcher').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        store.setView(view);
      });
    });

    // Clicking ambiguity badge quick-toggles the ambiguity filter
    const ambTrigger = container.querySelector('#metric-ambiguity-trigger');
    if (ambTrigger) {
      ambTrigger.addEventListener('click', () => {
        store.toggleAmbiguityFilter();
      });
    }
  }

  // Initial render & subscription
  update();
  store.subscribe(() => update());
}
