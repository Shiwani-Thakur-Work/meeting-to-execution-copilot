/**
 * modals.js
 * 
 * Interactive Dialogs, Drawers & Configuration Modals.
 * - Item Editor Modal (Human-in-the-Loop review, resolving unassigned owners, deadlines)
 * - Add Manual Item Modal
 * - Gemini API Key Settings Modal
 * - Toast Confirmation System
 */

import { store } from '../state/store.js';

export function setupModals(container) {
  container.innerHTML = `
    <!-- 1. Edit Item Modal -->
    <div class="modal-overlay" id="edit-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Edit Execution Item</h3>
          <button class="modal-close-btn" data-close="edit-modal">✕</button>
        </div>
        <div class="modal-body" id="edit-modal-body">
          <!-- Populated dynamically -->
        </div>
        <div class="modal-footer">
          <button class="btn-icon" data-close="edit-modal">Cancel</button>
          <button class="btn-primary" id="btn-save-edit">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- 2. Add Manual Item Modal -->
    <div class="modal-overlay" id="add-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Add Manual Execution Item</h3>
          <button class="modal-close-btn" data-close="add-modal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Item Type</label>
            <select class="form-select" id="add-item-type">
              <option value="action_item">Action Item</option>
              <option value="decision">Confirmed Decision</option>
              <option value="open_question">Open Question / Blocker</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Title / Description</label>
            <input type="text" class="form-input" id="add-item-title" placeholder="e.g. Schedule load testing drill" />
          </div>
          <div class="form-group" id="add-owner-group">
            <label class="form-label">Assignee</label>
            <input type="text" class="form-input" id="add-item-owner" placeholder="e.g. Alex or Marcus" />
          </div>
          <div class="form-group" id="add-deadline-group">
            <label class="form-label">Deadline / Milestone</label>
            <input type="text" class="form-input" id="add-item-deadline" placeholder="e.g. By Friday 5 PM" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-icon" data-close="add-modal">Cancel</button>
          <button class="btn-primary" id="btn-save-add">Add to Workbench</button>
        </div>
      </div>
    </div>

    <!-- 3. Gemini API Key Configuration Modal -->
    <div class="modal-overlay" id="api-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">Gemini API Settings</h3>
          <button class="modal-close-btn" data-close="api-modal">✕</button>
        </div>
        <div class="modal-body">
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            By default, <strong>Meeting-to-Execution Copilot</strong> runs with an instant, deterministic heuristic engine requiring zero external API keys.
          </p>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
            To enable deep semantic LLM extraction via <strong>Gemini 2.0 Flash</strong>, enter your Google Generative AI API key below. Your key is stored strictly in your browser's local storage and is never transmitted to any third-party server.
          </p>
          <div class="form-group" style="margin-top: 8px;">
            <label class="form-label">Google Gemini API Key</label>
            <input type="password" class="form-input" id="api-key-input" placeholder="AIzaSy..." value="${store.getState().apiKey}" />
            <span style="font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">
              Get a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="color: #38bdf8;">Google AI Studio</a>.
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-icon" id="btn-clear-api-key">Clear Key</button>
          <button class="btn-primary" id="btn-save-api-key">Save & Connect</button>
        </div>
      </div>
    </div>

    <!-- Toast Notifications Container -->
    <div class="toast-container" id="toast-container"></div>
  `;

  // Global Close Buttons
  container.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modalId = e.currentTarget.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Listen to open-edit-modal custom event
  window.addEventListener('open-edit-modal', (e) => {
    const { itemId } = e.detail;
    openEditModal(itemId);
  });

  // Listen to open-add-modal custom event
  window.addEventListener('open-add-modal', () => {
    openModal('add-modal');
  });

  // Navbar API Key button trigger
  const btnOpenApi = document.getElementById('btn-open-api-modal');
  if (btnOpenApi) {
    btnOpenApi.addEventListener('click', () => {
      const state = store.getState();
      const input = document.getElementById('api-key-input');
      if (input) input.value = state.apiKey;
      openModal('api-modal');
    });
  }

  // Save API Key
  const btnSaveApi = container.querySelector('#btn-save-api-key');
  if (btnSaveApi) {
    btnSaveApi.addEventListener('click', () => {
      const input = container.querySelector('#api-key-input');
      const key = input ? input.value.trim() : '';
      store.setApiKey(key);
      closeModal('api-modal');
      showToast(key ? 'Gemini API Key Connected!' : 'Switched to Offline Heuristic Engine');
    });
  }

  // Clear API Key
  const btnClearApi = container.querySelector('#btn-clear-api-key');
  if (btnClearApi) {
    btnClearApi.addEventListener('click', () => {
      store.setApiKey('');
      const input = container.querySelector('#api-key-input');
      if (input) input.value = '';
      closeModal('api-modal');
      showToast('API Key Cleared. Offline mode active.');
    });
  }

  // Save Add Item
  const btnSaveAdd = container.querySelector('#btn-save-add');
  if (btnSaveAdd) {
    btnSaveAdd.addEventListener('click', () => {
      const type = container.querySelector('#add-item-type').value;
      const title = container.querySelector('#add-item-title').value.trim();
      const assignee = container.querySelector('#add-item-owner').value.trim();
      const deadline = container.querySelector('#add-item-deadline').value.trim();

      if (!title) {
        showToast('Please enter an item title');
        return;
      }

      store.addCustomItem(type, { title, assignee, deadline });
      closeModal('add-modal');
      // Reset form
      container.querySelector('#add-item-title').value = '';
      container.querySelector('#add-item-owner').value = '';
      container.querySelector('#add-item-deadline').value = '';
      showToast('Added to execution workbench!');
    });
  }
}

/**
 * Opens a modal by element ID.
 */
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

/**
 * Closes a modal by element ID.
 */
export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

/**
 * Populates and opens the Edit Item modal.
 */
function openEditModal(itemId) {
  const state = store.getState();
  const item = 
    state.actionItems.find((i) => i.id === itemId) ||
    state.decisions.find((i) => i.id === itemId) ||
    state.openQuestions.find((i) => i.id === itemId);

  if (!item) return;

  const modalBody = document.getElementById('edit-modal-body');
  const speakers = state.parsedTranscript.speakers || [];

  modalBody.innerHTML = `
    <div class="form-group">
      <label class="form-label">Item Title / Action Statement</label>
      <input type="text" class="form-input" id="edit-field-title" value="${escapeAttr(item.title || item.statement || item.question)}" />
    </div>

    ${item.type === 'action_item' ? `
      <div class="form-group">
        <label class="form-label">Assignee (Resolves Unassigned Ambiguity)</label>
        <div style="display: flex; gap: 8px;">
          <select class="form-select" id="edit-select-owner" style="flex: 1;">
            <option value="">-- Choose from Meeting Speakers --</option>
            ${speakers.map(s => `
              <option value="${escapeAttr(s)}" ${item.assignee === s ? 'selected' : ''}>${escapeAttr(s)}</option>
            `).join('')}
            <option value="CUSTOM">Custom Name...</option>
          </select>
          <input type="text" class="form-input" id="edit-custom-owner" placeholder="Or enter name" value="${escapeAttr(item.assignee || '')}" style="flex: 1;" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Deadline / Milestone</label>
        <input type="text" class="form-input" id="edit-field-deadline" placeholder="e.g. By Friday, Oct 24th" value="${escapeAttr(item.deadline || '')}" />
      </div>

      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-select" id="edit-field-priority">
          <option value="high" ${item.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${item.priority === 'medium' || !item.priority ? 'selected' : ''}>Medium</option>
          <option value="low" ${item.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>
      </div>
    ` : ''}

    <div class="form-group">
      <label class="form-label" style="color: var(--text-tertiary);">Original Transcript Evidence Quote</label>
      <div style="font-family: var(--font-mono); font-size: 11px; color: #94a3b8; background: var(--bg-surface-elevated); padding: 8px; border-radius: 6px;">
        "${escapeAttr(item.evidenceQuote)}"
      </div>
    </div>
  `;

  // Handle owner dropdown sync
  const selectOwner = modalBody.querySelector('#edit-select-owner');
  const customOwner = modalBody.querySelector('#edit-custom-owner');
  if (selectOwner && customOwner) {
    selectOwner.addEventListener('change', (e) => {
      if (e.target.value && e.target.value !== 'CUSTOM') {
        customOwner.value = e.target.value;
      }
    });
  }

  // Handle Save
  const btnSave = document.getElementById('btn-save-edit');
  btnSave.onclick = () => {
    const updatedTitle = document.getElementById('edit-field-title').value.trim();
    const updates = { title: updatedTitle };

    if (item.type === 'action_item') {
      const updatedOwner = customOwner.value.trim() || null;
      const updatedDeadline = document.getElementById('edit-field-deadline').value.trim() || null;
      const updatedPriority = document.getElementById('edit-field-priority').value;

      updates.assignee = updatedOwner;
      updates.deadline = updatedDeadline;
      updates.priority = updatedPriority;
    }

    store.updateItem(item.id, updates);
    closeModal('edit-modal');
    showToast(`Updated ${item.id}`);
  };

  openModal('edit-modal');
}

/**
 * Displays a toast notification.
 */
export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 200ms ease';
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}

function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;');
}
