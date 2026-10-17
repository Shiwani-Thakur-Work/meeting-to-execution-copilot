/**
 * heuristicExtractor.js
 * 
 * Deterministic Heuristic Extraction Engine.
 * Enables 100% offline, client-side extraction without requiring external API calls or keys.
 * Accurately surfaces:
 * - Action Items (self-commitments, delegated tasks, unassigned chores)
 * - Decisions (confirmed consensus vs proposed ideas)
 * - Open Questions (blockers, unresolved ambiguities)
 * 
 * Every extracted item retains verbatim transcript citations and is processed
 * through the Ambiguity & Uncertainty Analyzer.
 */

import { analyzeAmbiguity } from './ambiguityDetector.js';

/**
 * Extracts execution items from structured turns using deterministic rules.
 * @param {Array} turns - Parsed conversational turns from parser.js
 * @param {string[]} speakers - Known speaker list
 * @returns {{ actionItems: Array, decisions: Array, openQuestions: Array }}
 */
export function extractExecutionItemsHeuristically(turns, speakers = []) {
  const actionItems = [];
  const decisions = [];
  const openQuestions = [];

  let actCounter = 1;
  let decCounter = 1;
  let queCounter = 1;

  turns.forEach((turn) => {
    const rawSpeech = turn.text;
    // Split speech into individual sentences for fine-grained quote extraction
    const sentences = splitIntoSentences(rawSpeech);

    sentences.forEach((sentence) => {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length < 8) return;

      const lower = cleanSentence.toLowerCase();

      // ----------------------------------------------------
      // 1. OPEN QUESTIONS & BLOCKERS DETECTION
      // ----------------------------------------------------
      const isQuestion = cleanSentence.endsWith('?') ||
        /\b(what happens if|who is|can someone|how do we|do we have|is there any|open question|blocker)\b/i.test(lower);

      if (isQuestion && !isDecisionSentence(lower) && !isDirectSelfCommitment(lower)) {
        const addressedTo = findAddressedPerson(cleanSentence, speakers, turn.speaker);
        openQuestions.push({
          id: `que-${queCounter++}`,
          type: 'open_question',
          title: cleanSentence,
          question: cleanSentence,
          raisedBy: turn.speaker,
          addressedTo: addressedTo || null,
          status: 'open',
          evidenceQuote: cleanSentence,
          evidenceLine: turn.startLine,
          timestamp: turn.timestamp
        });
        return; // Handled as question
      }

      // ----------------------------------------------------
      // 2. DECISIONS DETECTION
      // ----------------------------------------------------
      if (isDecisionSentence(lower)) {
        const isConfirmed = /\b(agreed|officially|decision:|approved|we will keep|we are officially)\b/i.test(lower);
        const decisionType = isConfirmed ? 'confirmed' : 'proposed';
        
        const decisionItem = {
          id: `dec-${decCounter++}`,
          type: 'decision',
          title: cleanSentence.replace(/^(decision:?\s*|agreed on\s*)/i, '').trim(),
          statement: cleanSentence,
          decisionType: decisionType,
          decisionMaker: turn.speaker,
          approved: isConfirmed,
          evidenceQuote: cleanSentence,
          evidenceLine: turn.startLine,
          timestamp: turn.timestamp
        };

        const ambiguity = analyzeAmbiguity(decisionItem);
        decisionItem.ambiguityFlags = ambiguity.flags;
        decisionItem.confidenceScore = ambiguity.confidenceScore;
        decisionItem.needsHumanReview = ambiguity.needsHumanReview;

        decisions.push(decisionItem);
        return; // Handled as decision
      }

      // ----------------------------------------------------
      // 3. ACTION ITEMS EXTRACTION
      // ----------------------------------------------------
      if (isActionItemSentence(lower)) {
        const extractedAssignee = detectAssignee(cleanSentence, lower, turn.speaker, speakers);
        const extractedDeadline = detectDeadline(cleanSentence, lower);
        const priority = detectPriority(lower);

        const actionItem = {
          id: `act-${actCounter++}`,
          type: 'action_item',
          title: summarizeTaskTitle(cleanSentence),
          assignee: extractedAssignee,
          deadline: extractedDeadline,
          priority: priority,
          status: 'pending_review',
          evidenceQuote: cleanSentence,
          evidenceLine: turn.startLine,
          speaker: turn.speaker,
          timestamp: turn.timestamp,
          isEdited: false
        };

        const ambiguity = analyzeAmbiguity(actionItem);
        actionItem.ambiguityFlags = ambiguity.flags;
        actionItem.confidenceScore = ambiguity.confidenceScore;
        actionItem.needsHumanReview = ambiguity.needsHumanReview;

        actionItems.push(actionItem);
      }
    });
  });

  return { actionItems, decisions, openQuestions };
}

/**
 * Splits text into grammatical sentences while preserving periods in version numbers (v2.0) or abbreviations.
 */
function splitIntoSentences(text) {
  if (!text) return [];
  return text
    .replace(/([.!?])\s+(?=[A-Z0-9"'])/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Checks if a sentence represents a confirmed decision or proposal.
 */
function isDecisionSentence(lower) {
  return (
    lower.startsWith('decision:') ||
    /\b(agreed\b|we decided|let's make an explicit decision|officially cutting|approved\.|consensus is|we approve)\b/i.test(lower)
  );
}

/**
 * Checks if speech is a self-commitment like "I will..." or "I'll take...".
 */
function isDirectSelfCommitment(lower) {
  return /\b(i will|i'll take|i commit|i can look at|i'll deploy)\b/i.test(lower);
}

/**
 * Checks if a sentence implies an operational action item.
 */
function isActionItemSentence(lower) {
  const actionTriggers = [
    /\bi will\b/i,
    /\bi'll\b/i,
    /\bi commit to\b/i,
    /\bi can\b/i,
    /\bneed to\b/i,
    /\bneeds to\b/i,
    /\bwe need\b/i,
    /\bsomeone should\b/i,
    /\bcan you\b/i,
    /\blet's schedule\b/i,
    /\baction item\b/i,
    /\btodo\b/i,
    /\bwill deliver\b/i,
    /\bwill push\b/i,
    /\bwill update\b/i,
    /\bwill configure\b/i,
    /\bwill draft\b/i,
    /\bwill schedule\b/i
  ];

  return actionTriggers.some((regex) => regex.test(lower));
}

/**
 * Extracts the likely assignee based on self-assignment or explicit delegation.
 * If ambiguous or unassigned, strictly preserves null or 'Unassigned' without hallucinating!
 */
function detectAssignee(sentence, lower, speaker, speakers) {
  // Case 1: First person self-commitment ("I will...", "I'll take...")
  if (/\b(i will|i'll|i commit|i can)\b/i.test(lower)) {
    return speaker;
  }

  // Case 2: Explicit delegation ("Marcus and David, let's...", "Sarah, will you...")
  for (const s of speakers) {
    const sLower = s.toLowerCase();
    const pattern = new RegExp(`\\b${sLower}\\b[,:]?\\s+(can you|will you|please|you take|and)\\b`, 'i');
    if (pattern.test(lower)) {
      return s;
    }
  }

  // Case 3: Unassigned chore statements ("Someone should...", "We need someone to...")
  if (/\b(someone|anyone|we definitely need someone|nobody)\b/i.test(lower)) {
    return null; // Deliberately null to trigger unassigned ambiguity badge!
  }

  // Case 4: Ambiguous group reference ("We need to...", "We should...")
  if (/\b(we need to|we should|let's)\b/i.test(lower)) {
    return null; // Left unassigned to uphold product anti-hallucination requirement
  }

  return null;
}

/**
 * Detects explicit or vague deadlines from sentence context.
 */
function detectDeadline(sentence, lower) {
  // 1. Explicit dates with day/month/time
  const explicitMatch = sentence.match(/\b(by\s+[A-Za-z]+,?\s+[A-Za-z]+\s+\d+(?:st|nd|rd|th)?(?:\s+at\s+[\d:]+\s*(?:AM|PM)?)?)\b/i);
  if (explicitMatch) return explicitMatch[1].trim();

  // 2. Named weekday deadlines ("by Friday morning", "by Wednesday")
  const weekdayMatch = sentence.match(/\b(by\s+(?:next\s+)?(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s+(?:morning|afternoon|evening|at\s+[\d:]+))?)\b/i);
  if (weekdayMatch) return weekdayMatch[1].trim();

  // 3. Relative calendar targets ("before October 31st", "by November 1st", "today", "tomorrow")
  const calendarMatch = sentence.match(/\b(before\s+[A-Za-z]+\s+\d+(?:st|nd|rd|th)?|by\s+[A-Za-z]+\s+\d+(?:st|nd|rd|th)?|today|tomorrow\s*(?:afternoon)?)\b/i);
  if (calendarMatch) return calendarMatch[1].trim();

  // 4. Vague temporal markers (will be flagged by ambiguity detector)
  const vagueMatch = sentence.match(/\b(next\s+week|soon|sometime\s+next\s+week|by\s+end\s+of\s+sprint|next\s+sprint|next\s+quarter)\b/i);
  if (vagueMatch) return vagueMatch[1].trim();

  return null;
}

/**
 * Detects priority level from urgency keywords.
 */
function detectPriority(lower) {
  if (/\b(immediately|p0|critical|blocker|outage|sev-1|highest priority|before we touch production)\b/i.test(lower)) {
    return 'high';
  }
  if (/\b(sometime|soon|if bandwidth|nice to have|v2\.1|later)\b/i.test(lower)) {
    return 'low';
  }
  return 'medium';
}

/**
 * Condenses a sentence into a clean, punchy action item title.
 */
function summarizeTaskTitle(sentence) {
  let title = sentence
    .replace(/^([A-Za-z0-9_.\s]+?)\s*:\s*/i, '') // Remove speaker label if present
    .replace(/^(I will|I'll take the|I'll|I commit to|We definitely need someone to|Someone should|I can|Decision:)\s+/i, '')
    .trim();

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }
  // Trim trailing periods
  return title.replace(/\.+$/, '');
}

/**
 * Identifies if a question was explicitly addressed to someone.
 */
function findAddressedPerson(sentence, speakers, currentSpeaker) {
  for (const s of speakers) {
    if (s !== currentSpeaker && sentence.toLowerCase().includes(s.toLowerCase())) {
      return s;
    }
  }
  return null;
}
