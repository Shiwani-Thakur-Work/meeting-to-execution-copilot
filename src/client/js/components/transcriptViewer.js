/**
 * transcriptViewer.js
 * 
 * Left Pane: Interactive Transcript Studio & Source Highlighting.
 * High-precision reading experience with clean conversational turns,
 * line numbering, search filtering, and smooth citation focus.
 */

import { store } from '../state/store.js';

export function renderTranscriptViewer(container) {
  let activeInputMode = 'view'; // 'view' | 'paste'
  let searchQuery = '';

  function render() {
    const state = store.getState();
    const turns = state.parsedTranscript.turns || [];
    const highlighted = state.highlightedEvidence;

    container.innerHTML = `
      <div class="pane pane-transcript">
        <!-- Header & View Mode Switcher -->
        <div class="pane-header">
          <div class="pane-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Transcript Studio</span>
            <span style="font-size: 11px; color: var(--text-tertiary); font-weight: normal; font-family: var(--font-mono);">
              ${turns.length} turns · ${state.parsedTranscript.speakers.length} speakers
            </span>
          </div>

          <div class="transcript-controls">
            <button class="btn-tab-toggle ${activeInputMode === 'view' ? 'active' : ''}" id="btn-mode-view">
              Reading View
            </button>
            <button class="btn-tab-toggle ${activeInputMode === 'paste' ? 'active' : ''}" id="btn-mode-paste">
              Paste / Upload
            </button>
          </div>
        </div>

        <!-- Integrated Search Bar (Reading Mode Only) -->
        ${activeInputMode === 'view' ? `
          <div class="transcript-search-bar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-tertiary);">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="search-input" id="transcript-search" placeholder="Search transcript or speakers..." value="${searchQuery}" />
            ${highlighted ? `
              <button class="btn-icon" id="btn-clear-highlight" style="padding: 2px 7px; font-size: 10px;" title="Clear active citation highlight">
                Clear Focus
              </button>
            ` : ''}
          </div>
        ` : ''}

        <!-- Transcript Content Area -->
        ${activeInputMode === 'view' ? `
          <div class="transcript-scroll-area" id="transcript-scroll-box">
            ${renderTurnsList(turns, highlighted, searchQuery)}
          </div>
        ` : `
          <div class="custom-input-box">
            <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.4;">
              Paste meeting notes or transcripts from Zoom, Teams, Google Meet, or Otter:
            </p>
            <textarea class="custom-textarea" id="custom-transcript-text" placeholder="Alex (10:00 AM): Let's lock in the schema migration...&#10;Marcus: I will complete the migration script by Friday.">${state.rawTranscript}</textarea>
            
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <input type="file" id="file-upload-input" accept=".txt,.vtt,.srt,.md" style="display: none;" />
              <button class="btn-icon" id="btn-trigger-upload">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Upload .txt / .vtt</span>
              </button>

              <button class="btn-primary" id="btn-process-custom">
                <span>⚡ Extract Action Items</span>
              </button>
            </div>
          </div>
        `}
      </div>
    `;

    bindEvents();

    // Auto-scroll to highlighted citation if active
    if (highlighted && activeInputMode === 'view') {
      setTimeout(() => {
        const highlightedEl = container.querySelector('.highlighted-quote');
        if (highlightedEl) {
          highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  }

  function renderTurnsList(turns, highlighted, query) {
    if (!turns.length) {
      return `<div style="text-align: center; color: var(--text-tertiary); padding: 50px 20px;">No transcript loaded. Select a meeting above.</div>`;
    }

    return turns.map((turn) => {
      let isHighlighted = false;
      if (highlighted) {
        const quoteSnippet = (highlighted.quote || '').toLowerCase().slice(0, 35);
        if (turn.startLine === highlighted.lineIndex || turn.text.toLowerCase().includes(quoteSnippet)) {
          isHighlighted = true;
        }
      }

      if (query && !turn.text.toLowerCase().includes(query.toLowerCase()) && !turn.speaker.toLowerCase().includes(query.toLowerCase())) {
        return '';
      }

      const initial = (turn.speaker || 'U').charAt(0).toUpperCase();

      return `
        <div class="transcript-turn-block ${isHighlighted ? 'highlighted-quote' : ''}" id="turn-${turn.startLine}">
          <div class="turn-header">
            <div class="speaker-pill">
              <span class="speaker-avatar">${initial}</span>
              <span>${turn.speaker}</span>
            </div>
            <div>
              <span class="turn-line-number">L${turn.startLine < 10 ? '0' + turn.startLine : turn.startLine}</span>
              ${turn.timestamp ? `<span class="timestamp-pill">${turn.timestamp}</span>` : ''}
            </div>
          </div>
          <div class="turn-text">${highlightSearchText(turn.text, query)}</div>
        </div>
      `;
    }).join('');
  }

  function highlightSearchText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: rgba(245, 158, 11, 0.35); color: #fff; padding: 0 2px; border-radius: 2px;">$1</mark>');
  }

  function bindEvents() {
    const btnView = container.querySelector('#btn-mode-view');
    const btnPaste = container.querySelector('#btn-mode-paste');

    if (btnView) {
      btnView.addEventListener('click', () => {
        activeInputMode = 'view';
        render();
      });
    }

    if (btnPaste) {
      btnPaste.addEventListener('click', () => {
        activeInputMode = 'paste';
        render();
      });
    }

    const searchInput = container.querySelector('#transcript-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        const scrollBox = container.querySelector('#transcript-scroll-box');
        if (scrollBox) {
          const state = store.getState();
          scrollBox.innerHTML = renderTurnsList(state.parsedTranscript.turns, state.highlightedEvidence, searchQuery);
        }
      });
    }

    const clearHighlightBtn = container.querySelector('#btn-clear-highlight');
    if (clearHighlightBtn) {
      clearHighlightBtn.addEventListener('click', () => {
        store.clearEvidenceHighlight();
      });
    }

    const btnProcess = container.querySelector('#btn-process-custom');
    if (btnProcess) {
      btnProcess.addEventListener('click', () => {
        const textarea = container.querySelector('#custom-transcript-text');
        if (textarea && textarea.value.trim()) {
          store.processTranscript(textarea.value);
          activeInputMode = 'view';
          render();
        }
      });
    }

    const fileInput = container.querySelector('#file-upload-input');
    const triggerUpload = container.querySelector('#btn-trigger-upload');
    if (triggerUpload && fileInput) {
      triggerUpload.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target.result;
            const textarea = container.querySelector('#custom-transcript-text');
            if (textarea) textarea.value = content;
          };
          reader.readAsText(file);
        }
      });
    }
  }

  // Initial render & subscription
  render();
  store.subscribe(() => render());
}
