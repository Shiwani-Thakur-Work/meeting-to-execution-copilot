/**
 * metricsBar.js
 * 
 * Top Real-Time Metrics Strip.
 * Calculates and visualizes executive indicators:
 * - Total Action Items extracted
 * - Pending Review count
 * - Active Ambiguity & Uncertainty Alerts
 * - Confirmed Decisions
 * - Open Blockers & Clarification Needs
 * - Estimated PM Time Saved
 */

import { store } from '../state/store.js';

export function renderMetricsBar(container) {
  function update() {
    const metrics = store.getMetrics();

    container.innerHTML = `
      <div class="metrics-strip">
        <div class="metrics-group">
          <!-- Total Actions -->
          <div class="metric-pill" title="Total structured action items extracted">
            <span class="metric-label">Actions:</span>
            <span class="metric-value">${metrics.totalActions}</span>
          </div>

          <!-- Needs Review / Pending -->
          <div class="metric-pill ${metrics.pendingReviewActions > 0 ? 'metric-pill-warning' : 'metric-pill-success'}" title="Action items awaiting PM verification">
            <span class="metric-label">Needs Review:</span>
            <span class="metric-value">${metrics.pendingReviewActions}</span>
          </div>

          <!-- Ambiguity Alerts -->
          <div class="metric-pill ${metrics.totalAmbiguities > 0 ? 'metric-pill-warning' : ''}" id="metric-ambiguity-trigger" style="cursor: pointer;" title="Detected unassigned owners, vague dates, or hedged proposals">
            <span class="metric-label">⚠️ Ambiguity Flags:</span>
            <span class="metric-value" style="color: #fbbf24;">${metrics.totalAmbiguities}</span>
          </div>
        </div>

        <div class="metrics-group">
          <!-- Confirmed Decisions -->
          <div class="metric-pill metric-pill-success" title="Decisions confirmed with team consensus">
            <span class="metric-label">✅ Decisions:</span>
            <span class="metric-value">${metrics.confirmedDecisions}</span>
          </div>

          <!-- Open Questions / Blockers -->
          <div class="metric-pill" title="Unresolved questions or operational blockers">
            <span class="metric-label">❓ Open Questions:</span>
            <span class="metric-value" style="color: #fda4af;">${metrics.openBlockers}</span>
          </div>

          <!-- Estimated Time Saved -->
          <div class="metric-pill" title="Calculated based on average manual meeting note scrubbing">
            <span class="metric-label">⚡ Est. Saved:</span>
            <span class="metric-value" style="color: #38bdf8;">~${metrics.minutesSaved} min</span>
          </div>
        </div>
      </div>
    `;

    // Clicking the ambiguity metric quick-toggles ambiguity filter
    const ambTrigger = container.querySelector('#metric-ambiguity-trigger');
    if (ambTrigger) {
      ambTrigger.addEventListener('click', () => {
        store.toggleAmbiguityFilter();
      });
    }
  }

  // Initial render & subscribe to store updates
  update();
  store.subscribe(() => update());
}
