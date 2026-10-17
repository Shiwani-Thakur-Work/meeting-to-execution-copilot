/**
 * metricsBar.js
 * 
 * Executive Status & Audit Readiness Ribbon.
 * Replaces generic chunky metric boxes with a clean, high-precision progress gauge
 * and interactive status indicators.
 */

import { store } from '../state/store.js';

export function renderMetricsBar(container) {
  function update() {
    const metrics = store.getMetrics();
    const totalItems = metrics.totalActions + metrics.confirmedDecisions;
    const verifiedItems = metrics.approvedActions + metrics.confirmedDecisions;
    const progressPercent = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 100;

    container.innerHTML = `
      <div class="metrics-strip">
        <!-- Audit Progress Gauge -->
        <div class="metrics-strip-left">
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
        </div>

        <!-- Executive Metrics Indicators -->
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

          <!-- Open Questions -->
          <div class="metric-pill" title="Unresolved questions or blockers">
            <span>❓ Questions:</span>
            <span class="metric-value" style="color: #fb7185;">${metrics.openBlockers}</span>
          </div>

          <!-- Ambiguity Flags -->
          <div class="metric-pill ${metrics.totalAmbiguities > 0 ? 'metric-pill-warning' : ''}" id="metric-ambiguity-trigger" style="cursor: pointer;" title="Click to filter items with missing owners or vague dates">
            <span>⚠️ Flags:</span>
            <span class="metric-value" style="color: #fbbf24;">${metrics.totalAmbiguities}</span>
          </div>

          <!-- Time Saved -->
          <div class="metric-pill" title="Estimated PM time saved vs manual review">
            <span>⚡ Saved:</span>
            <span class="metric-value" style="color: #60a5fa;">~${metrics.minutesSaved}m</span>
          </div>
        </div>
      </div>
    `;

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
