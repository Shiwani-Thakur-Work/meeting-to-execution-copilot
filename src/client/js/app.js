/**
 * app.js
 * 
 * Main Application Bootstrap for Meeting-to-Execution Copilot.
 * Initializes reactive components, mounts them to DOM nodes, and triggers
 * the first transcript processing cycle.
 */

import { store } from './state/store.js';
import { renderNavbar } from './components/navbar.js';
import { renderMetricsBar } from './components/metricsBar.js';
import { renderTranscriptViewer } from './components/transcriptViewer.js';
import { renderExecutionCards } from './components/executionCards.js';
import { setupModals } from './components/modals.js';
import { setupExportModal } from './components/exportModal.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Meeting-to-Execution Copilot] Initializing application...');

  const navbarEl = document.getElementById('navbar-container');
  const metricsEl = document.getElementById('metrics-container');
  const transcriptEl = document.getElementById('transcript-pane-container');
  const workbenchEl = document.getElementById('workbench-pane-container');
  const modalsEl = document.getElementById('modals-container');

  // Mount components
  if (navbarEl) renderNavbar(navbarEl);
  if (metricsEl) renderMetricsBar(metricsEl);
  if (transcriptEl) renderTranscriptViewer(transcriptEl);
  if (workbenchEl) renderExecutionCards(workbenchEl);
  if (modalsEl) {
    setupModals(modalsEl);
    setupExportModal(modalsEl);
  }

  // Initialize store state with default preset
  try {
    await store.initialize();
    console.log('[Meeting-to-Execution Copilot] Application successfully ready.');
  } catch (err) {
    console.error('[Meeting-to-Execution Copilot] Initialization error:', err);
  }
});
