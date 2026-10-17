/**
 * store.js
 * 
 * Central Reactive Application Store for Meeting-to-Execution Copilot.
 * Manages transcript ingestion, extraction states, human-in-the-loop review approvals,
 * active filters, bidirectional evidence highlight synchronization, and local persistence.
 */

import { parseTranscript } from '../engine/parser.js';
import { extractExecutionItemsWithGemini } from '../engine/geminiExtractor.js';
import { SAMPLE_TRANSCRIPTS } from '../data/sampleTranscripts.js';

const STORAGE_KEYS = {
  API_KEY: 'mte_gemini_api_key',
  LAST_PRESET: 'mte_last_preset_id'
};

class CopilotStore {
  constructor() {
    this.state = {
      rawTranscript: '',
      parsedTranscript: { turns: [], speakers: [], lines: [], textLength: 0 },
      activePresetId: null,
      isExtracting: false,
      extractionEngine: 'deterministic_heuristic',
      actionItems: [],
      decisions: [],
      openQuestions: [],
      activeFilterTab: 'all', // 'all' | 'actions' | 'decisions' | 'questions' | 'needs_review'
      ambiguityFilterOnly: false,
      highlightedEvidence: null, // { lineIndex, quote, itemId }
      apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
      searchQuery: ''
    };

    this.listeners = new Set();
  }

  /**
   * Subscribes a callback to state changes.
   * @param {Function} listener 
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emits state changes to all subscribers.
   */
  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error('[Store] Listener error:', err);
      }
    });
  }

  getState() {
    return this.state;
  }

  /**
   * Initializes the store with the first sample transcript or stored preset.
   */
  async initialize() {
    const savedPresetId = localStorage.getItem(STORAGE_KEYS.LAST_PRESET) || SAMPLE_TRANSCRIPTS[0].id;
    await this.loadPreset(savedPresetId);
  }

  /**
   * Sets and persists the user's Gemini API key.
   */
  setApiKey(key) {
    this.state.apiKey = (key || '').trim();
    if (this.state.apiKey) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, this.state.apiKey);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
    this.notify();
  }

  /**
   * Loads a preset transcript from the library and runs extraction.
   */
  async loadPreset(presetId) {
    const preset = SAMPLE_TRANSCRIPTS.find((p) => p.id === presetId) || SAMPLE_TRANSCRIPTS[0];
    this.state.activePresetId = preset.id;
    localStorage.setItem(STORAGE_KEYS.LAST_PRESET, preset.id);
    await this.processTranscript(preset.text);
  }

  /**
   * Processes a new raw transcript text through parsing and extraction pipeline.
   */
  async processTranscript(rawText) {
    this.state.isExtracting = true;
    this.state.rawTranscript = rawText;
    this.state.highlightedEvidence = null;
    this.notify();

    // 1. Normalize and segment into turns
    const parsed = parseTranscript(rawText);
    this.state.parsedTranscript = parsed;

    // 2. Run extraction (Gemini API if key present, else deterministic heuristics)
    try {
      const result = await extractExecutionItemsWithGemini(
        rawText,
        parsed.turns,
        parsed.speakers,
        this.state.apiKey
      );

      this.state.actionItems = result.actionItems;
      this.state.decisions = result.decisions;
      this.state.openQuestions = result.openQuestions;
      this.state.extractionEngine = result.sourceEngine;
    } catch (err) {
      console.error('[Store] Extraction processing error:', err);
    } finally {
      this.state.isExtracting = false;
      this.notify();
    }
  }

  /**
   * Sets the active filter tab in the execution cards pane.
   */
  setFilterTab(tab) {
    this.state.activeFilterTab = tab;
    this.notify();
  }

  /**
   * Toggles the filter to show only items with ambiguity flags.
   */
  toggleAmbiguityFilter() {
    this.state.ambiguityFilterOnly = !this.state.ambiguityFilterOnly;
    this.notify();
  }

  /**
   * Sets the search query for filtering items.
   */
  setSearchQuery(query) {
    this.state.searchQuery = (query || '').toLowerCase();
    this.notify();
  }

  /**
   * Highlights an evidence passage in both the transcript and cards.
   */
  setEvidenceHighlight(lineIndex, quote, itemId = null) {
    this.state.highlightedEvidence = { lineIndex, quote, itemId };
    this.notify();
  }

  /**
   * Clears active evidence highlight.
   */
  clearEvidenceHighlight() {
    this.state.highlightedEvidence = null;
    this.notify();
  }

  /**
   * Marks an action item as reviewed and approved.
   */
  approveActionItem(id) {
    const item = this.state.actionItems.find((i) => i.id === id);
    if (item) {
      item.status = 'approved';
      item.needsHumanReview = false;
      this.notify();
    }
  }

  /**
   * Toggles approval on a decision.
   */
  toggleDecisionApproval(id) {
    const item = this.state.decisions.find((i) => i.id === id);
    if (item) {
      item.approved = !item.approved;
      item.needsHumanReview = !item.approved;
      this.notify();
    }
  }

  /**
   * Marks an open question as resolved.
   */
  toggleQuestionResolved(id) {
    const item = this.state.openQuestions.find((i) => i.id === id);
    if (item) {
      item.status = item.status === 'open' ? 'resolved' : 'open';
      this.notify();
    }
  }

  /**
   * Updates an item's editable fields (title, assignee, deadline, priority).
   */
  updateItem(id, updatedFields) {
    let found = this.state.actionItems.find((i) => i.id === id);
    if (found) {
      Object.assign(found, updatedFields);
      found.isEdited = true;
      // Re-evaluate ambiguity after human update
      if (found.assignee && found.assignee !== 'Unassigned') {
        found.ambiguityFlags = found.ambiguityFlags.filter((f) => f.type !== 'unassigned_owner');
      }
      if (found.deadline) {
        found.ambiguityFlags = found.ambiguityFlags.filter((f) => f.type !== 'vague_deadline');
      }
      found.needsHumanReview = found.ambiguityFlags.length > 0;
      this.notify();
      return;
    }

    found = this.state.decisions.find((i) => i.id === id);
    if (found) {
      Object.assign(found, updatedFields);
      this.notify();
      return;
    }

    found = this.state.openQuestions.find((i) => i.id === id);
    if (found) {
      Object.assign(found, updatedFields);
      this.notify();
    }
  }

  /**
   * Deletes an item (for user removal of false positives).
   */
  deleteItem(id) {
    this.state.actionItems = this.state.actionItems.filter((i) => i.id !== id);
    this.state.decisions = this.state.decisions.filter((i) => i.id !== id);
    this.state.openQuestions = this.state.openQuestions.filter((i) => i.id !== id);
    this.notify();
  }

  /**
   * Adds a manually entered action item, decision, or question.
   */
  addCustomItem(type, itemData) {
    const timestamp = 'Manual';
    if (type === 'action_item') {
      const newItem = {
        id: `act-${Date.now().toString().slice(-4)}`,
        type: 'action_item',
        title: itemData.title || 'New Action Item',
        assignee: itemData.assignee || null,
        deadline: itemData.deadline || null,
        priority: itemData.priority || 'medium',
        status: 'approved',
        evidenceQuote: itemData.evidenceQuote || 'Manually added during PM review',
        evidenceLine: 1,
        speaker: 'PM User',
        timestamp,
        ambiguityFlags: [],
        confidenceScore: 1.0,
        needsHumanReview: false,
        isEdited: true
      };
      this.state.actionItems.unshift(newItem);
    } else if (type === 'decision') {
      const newItem = {
        id: `dec-${Date.now().toString().slice(-4)}`,
        type: 'decision',
        title: itemData.title || itemData.statement || 'New Decision',
        statement: itemData.statement || itemData.title || 'New Decision',
        decisionType: 'confirmed',
        decisionMaker: 'PM User',
        approved: true,
        evidenceQuote: itemData.evidenceQuote || 'Manually ratified by PM',
        evidenceLine: 1,
        ambiguityFlags: [],
        confidenceScore: 1.0,
        needsHumanReview: false
      };
      this.state.decisions.unshift(newItem);
    } else if (type === 'open_question') {
      const newItem = {
        id: `que-${Date.now().toString().slice(-4)}`,
        type: 'open_question',
        title: itemData.question || 'New Open Question',
        question: itemData.question || 'New Open Question',
        raisedBy: 'PM User',
        addressedTo: itemData.addressedTo || null,
        status: 'open',
        evidenceQuote: 'Identified during post-meeting audit',
        evidenceLine: 1
      };
      this.state.openQuestions.unshift(newItem);
    }
    this.notify();
  }

  /**
   * Computes real-time executive metrics for display in top header.
   */
  getMetrics() {
    const { actionItems, decisions, openQuestions } = this.state;
    const totalActions = actionItems.length;
    const approvedActions = actionItems.filter((a) => a.status === 'approved').length;
    const pendingReviewActions = actionItems.filter((a) => a.status === 'pending_review').length;

    let totalAmbiguities = 0;
    actionItems.forEach((a) => {
      totalAmbiguities += (a.ambiguityFlags || []).length;
    });
    decisions.forEach((d) => {
      totalAmbiguities += (d.ambiguityFlags || []).length;
    });

    const confirmedDecisions = decisions.filter((d) => d.decisionType === 'confirmed').length;
    const openBlockers = openQuestions.filter((q) => q.status === 'open').length;

    // Estimated minutes saved vs manual PM note scrubbing (approx 3.5 min per action/decision)
    const minutesSaved = Math.max(5, (totalActions + decisions.length) * 3);

    return {
      totalActions,
      approvedActions,
      pendingReviewActions,
      totalAmbiguities,
      confirmedDecisions,
      openBlockers,
      minutesSaved
    };
  }
}

// Export singleton store instance
export const store = new CopilotStore();
