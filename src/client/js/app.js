/**
 * app.js
 * 
 * Main Application Bootstrap for Meeting-to-Execution Copilot.
 * Initializes reactive components, dynamically mounts layout views:
 * 1. 📋 Execution Board (Kanban / Linear Columns)
 * 2. 🔍 Audit Studio (Split-Screen Transcript & Evidence Highlight)
 * 3. 📝 Executive Briefing (Leadership Digest)
 */

import { store } from './state/store.js';
import { renderNavbar } from './components/navbar.js';
import { renderMetricsBar } from './components/metricsBar.js';
import { renderBoardView } from './components/boardView.js';
import { renderTranscriptViewer } from './components/transcriptViewer.js';
import { renderExecutionCards } from './components/executionCards.js';
import { renderBriefingView } from './components/briefingView.js';
import { setupModals } from './components/modals.js';
import { setupExportModal } from './components/exportModal.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Meeting-to-Execution Copilot] Bootstrapping...');

  const navbarEl = document.getElementById('navbar-container');
  const metricsEl = document.getElementById('metrics-container');
  const workspaceEl = document.getElementById('workspace-container');
  const modalsEl = document.getElementById('modals-container');

  // Mount Header & Navigation
  if (navbarEl) renderNavbar(navbarEl);
  if (metricsEl) renderMetricsBar(metricsEl);
  if (modalsEl) {
    setupModals(modalsEl);
    setupExportModal(modalsEl);
  }

  // Workspace View Manager
  function updateWorkspace() {
    if (!workspaceEl) return;
    const view = store.getState().currentView || 'board';
    workspaceEl.className = `workspace-container view-${view}`;

    if (view === 'board') {
      renderBoardView(workspaceEl);
    } else if (view === 'briefing') {
      renderBriefingView(workspaceEl);
    } else {
      // Split Audit Studio View
      workspaceEl.innerHTML = `
        <section class="pane pane-transcript" id="transcript-pane-container" aria-label="Meeting Transcript Viewer"></section>
        <section class="pane pane-workbench" id="workbench-pane-container" aria-label="Execution Workbench"></section>
      `;
      const tPane = workspaceEl.querySelector('#transcript-pane-container');
      const wPane = workspaceEl.querySelector('#workbench-pane-container');
      if (tPane) renderTranscriptViewer(tPane);
      if (wPane) renderExecutionCards(wPane);
    }
  }

  // Subscribe view changes
  store.subscribe(() => {
    updateWorkspace();
  });

  // Initialize store state with default preset
  try {
    await store.initialize();
    updateWorkspace();
    console.log('[Meeting-to-Execution Copilot] Application successfully ready.');
  } catch (err) {
    console.error('[Meeting-to-Execution Copilot] Initialization error:', err);
  }
});
