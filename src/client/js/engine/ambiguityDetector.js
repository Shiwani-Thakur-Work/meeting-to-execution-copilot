/**
 * ambiguityDetector.js
 * 
 * Core Ambiguity & Uncertainty Analyzer for Meeting-to-Execution Copilot.
 * 
 * Enforces the primary product anti-hallucination guardrail:
 * "The system must never invent ownership or convert casual suggestions into firm commitments."
 * 
 * Scrutinizes candidate items for:
 * 1. Missing or generic assignees ("Someone", "We should", "Anyone")
 * 2. Unanchored temporal references ("next week", "soon", "later")
 * 3. Hedging and speculative vocabulary ("maybe", "could possibly", "might")
 * 4. Unconfirmed consensus on critical architectural or business paths
 */

// Temporal markers indicating vague, uncommitted dates
const VAGUE_TEMPORAL_PATTERNS = [
  /\bnext\s+week\b/i,
  /\bsoon\b/i,
  /\bsometime\b/i,
  /\blater\b/i,
  /\beventually\b/i,
  /\bdown\s+the\s+road\b/i,
  /\bnext\s+sprint\b/i,
  /\bnext\s+quarter\b/i,
  /\bbefore\s+we\s+launch\b/i,
  /\bwhen\s+we\s+have\s+time\b/i,
  /\bif\s+bandwidth\s+permits\b/i
];

// Hedging verbs and speculative qualifiers
const HEDGING_PATTERNS = [
  /\bmaybe\b/i,
  /\bperhaps\b/i,
  /\bpossibly\b/i,
  /\bmight\b/i,
  /\bcould\s+look\s+into\b/i,
  /\bwe\s+should\s+think\s+about\b/i,
  /\bwe\s+might\s+want\s+to\b/i,
  /\bi\s+suppose\b/i,
  /\bprobably\b/i,
  /\bif\s+possible\b/i
];

// Generic or non-committal owner mentions
const GENERIC_OWNERS = [
  'someone',
  'anyone',
  'anybody',
  'everybody',
  'team',
  'we',
  'us',
  'unassigned',
  'nobody',
  'tbd'
];

/**
 * Analyzes an action item or decision for uncertainty and returns detected flags.
 * @param {Object} item - Candidate item object
 * @param {string} item.title
 * @param {string} item.evidenceQuote
 * @param {string|null} item.assignee
 * @param {string|null} item.deadline
 * @param {string} item.type - 'action_item' | 'decision' | 'open_question'
 * @returns {{ flags: Array, confidenceScore: number, needsHumanReview: boolean }}
 */
export function analyzeAmbiguity(item) {
  const flags = [];
  let scoreDeduction = 0;
  const quote = (item.evidenceQuote || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const textCorpus = `${title} ${quote}`;

  // 1. Assignee Uncertainty Check (Only relevant for Action Items)
  if (item.type === 'action_item') {
    const rawOwner = (item.assignee || '').trim().toLowerCase();
    const isUnassigned = !rawOwner || GENERIC_OWNERS.includes(rawOwner);

    if (isUnassigned) {
      flags.push({
        type: 'unassigned_owner',
        severity: 'high',
        label: 'Missing Owner',
        message: 'No specific individual explicitly committed to this task.',
        recommendation: 'Select a named owner from the participants list.'
      });
      scoreDeduction += 0.35;
    }
  }

  // 2. Temporal Fuzziness Check
  const deadlineStr = (item.deadline || '').toLowerCase();
  let hasVagueDeadline = false;

  for (const pattern of VAGUE_TEMPORAL_PATTERNS) {
    if (pattern.test(deadlineStr) || pattern.test(textCorpus)) {
      hasVagueDeadline = true;
      break;
    }
  }

  if (hasVagueDeadline || (item.type === 'action_item' && !item.deadline)) {
    const isTotallyMissing = !item.deadline;
    flags.push({
      type: 'vague_deadline',
      severity: isTotallyMissing ? 'medium' : 'high',
      label: isTotallyMissing ? 'Unspecified Due Date' : 'Vague Timeline',
      message: isTotallyMissing 
        ? 'No milestone or deadline was specified during the conversation.'
        : `Timeline is anchored to an ambiguous marker ("${item.deadline || 'vague reference'}").`,
      recommendation: 'Anchor to a specific date or sprint milestone before exporting.'
    });
    scoreDeduction += 0.20;
  }

  // 3. Hedged Commitment Check (Speculative vs Concrete)
  let hasHedging = false;
  for (const pattern of HEDGING_PATTERNS) {
    if (pattern.test(textCorpus)) {
      hasHedging = true;
      break;
    }
  }

  if (hasHedging) {
    flags.push({
      type: 'hedged_commitment',
      severity: 'medium',
      label: 'Tentative / Hedged Commitment',
      message: 'Language indicates brainstorming, suggestion, or conditional intent rather than a binding agreement.',
      recommendation: 'Verify if the team finalized this or if it remains an exploratory proposal.'
    });
    scoreDeduction += 0.25;
  }

  // 4. Decision Consensus Check
  if (item.type === 'decision') {
    if (item.decisionType === 'proposed' || hasHedging) {
      flags.push({
        type: 'unconfirmed_proposal',
        severity: 'high',
        label: 'Unconfirmed Proposal',
        message: 'This topic was proposed or discussed, but explicit ratification was not confirmed by the group.',
        recommendation: 'Clarify whether consensus was officially reached.'
      });
      scoreDeduction += 0.30;
    }
  }

  // Calculate final confidence score between 0.10 and 1.00
  const confidenceScore = Math.max(0.15, Math.min(1.0, 1.0 - scoreDeduction));
  const needsHumanReview = flags.length > 0 || confidenceScore < 0.75;

  return {
    flags,
    confidenceScore: parseFloat(confidenceScore.toFixed(2)),
    needsHumanReview
  };
}
