/**
 * navbar.js
 * 
 * Top Application Header & Navigation Bar.
 * Houses branding assets, meeting transcript preset selector,
 * active AI/Heuristic engine indicator, and configuration modals.
 */

import { store } from '../state/store.js';
import { SAMPLE_TRANSCRIPTS } from '../data/sampleTranscripts.js';

export function renderNavbar(container) {
  container.innerHTML = `
    <header class="app-header">
      <!-- Brand Logo & Title -->
      <a href="#" class="brand-group" id="btn-brand-home" title="Meeting-to-Execution Copilot">
        <img src="./assets/logo.svg" alt="Meeting-to-Execution Copilot" class="brand-logo-img" />
      </a>

      <!-- Preset Selector -->
      <div class="header-center">
        <span class="preset-picker-label">Sample Meeting:</span>
        <select class="preset-select" id="preset-selector" aria-label="Select meeting transcript">
          ${SAMPLE_TRANSCRIPTS.map((t) => `
            <option value="${t.id}">${t.title}</option>
          `).join('')}
        </select>
      </div>

      <!-- Actions & Engine Indicator -->
      <div class="header-actions">
        <!-- Engine Status Badge -->
        <div class="engine-status-badge" id="engine-status" title="Active extraction pipeline">
          <span class="engine-status-dot"></span>
          <span id="engine-status-text">⚡ Offline Heuristics</span>
        </div>

        <!-- API Settings Modal Button -->
        <button class="btn-icon" id="btn-open-api-modal" title="Configure Gemini API Key">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span>API Key</span>
        </button>

        <!-- GitHub Repo Link -->
        <a href="https://github.com/Shiwani-Thakur-Work" target="_blank" rel="noopener noreferrer" class="btn-icon" title="View Source on GitHub">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </header>
  `;

  // Bind Preset Change
  const selector = container.querySelector('#preset-selector');
  selector.addEventListener('change', (e) => {
    store.loadPreset(e.target.value);
  });

  // Subscribe to Engine status changes
  store.subscribe((state) => {
    const statusText = container.querySelector('#engine-status-text');
    if (statusText) {
      if (state.apiKey) {
        statusText.textContent = '✨ Gemini 2.0 Flash';
      } else {
        statusText.textContent = '⚡ Offline Heuristics';
      }
    }
  });
}
