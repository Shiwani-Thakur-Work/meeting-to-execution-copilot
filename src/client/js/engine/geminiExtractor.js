/**
 * geminiExtractor.js
 * 
 * Direct Browser Integration with Google Gemini API.
 * Uses structured JSON prompting to extract action items, decisions, and open questions
 * with strict instructions against hallucinating commitments or owners.
 * 
 * Gracefully falls back to heuristicExtractor if no API key is supplied or on network failure.
 */

import { analyzeAmbiguity } from './ambiguityDetector.js';
import { extractExecutionItemsHeuristically } from './heuristicExtractor.js';

const GEMINI_MODEL = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

/**
 * Extracts meeting outcomes via Gemini API or falls back to offline heuristics.
 * @param {string} rawTranscriptText - Full meeting text
 * @param {Array} parsedTurns - Structured conversational turns
 * @param {string[]} speakers - Extracted list of speakers
 * @param {string|null} apiKey - User-provided Gemini API key
 * @returns {Promise<{ actionItems: Array, decisions: Array, openQuestions: Array, sourceEngine: string }>}
 */
export async function extractExecutionItemsWithGemini(rawTranscriptText, parsedTurns, speakers = [], apiKey = null) {
  // If no API key is provided, run heuristic extraction immediately
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    const offlineResult = extractExecutionItemsHeuristically(parsedTurns, speakers);
    return {
      ...offlineResult,
      sourceEngine: 'deterministic_heuristic'
    };
  }

  const prompt = `You are the Meeting-to-Execution Copilot, an audit-focused executive assistant designed to extract verifiable action items, decisions, and open questions from meeting transcripts.

CRITICAL ANTI-HALLUCINATION RULES:
1. NEVER invent or hallucinate an owner. If someone says "Someone should test this" or "We need to fix this", set assignee to null. Only assign an owner if a named person explicitly commits ("I will...", "Sarah will...").
2. NEVER invent a deadline. If no explicit date or timeframe is spoken, set deadline to null. If a vague phrase is used (e.g. "next week", "soon"), record that exact phrase.
3. Distinguish confirmed decisions (agreed by team/leader) from mere proposals/suggestions.
4. For EVERY item, you MUST provide the verbatim 'evidenceQuote' directly from the transcript text.
5. Identify any open questions, blockers, or ambiguities requiring team follow-up.

Transcript:
"""
${rawTranscriptText}
"""

Output MUST be a single valid JSON object strictly matching this schema:
{
  "actionItems": [
    {
      "title": "Concise task description",
      "assignee": "Name or null",
      "deadline": "Extracted date/timeline or null",
      "priority": "high" | "medium" | "low",
      "evidenceQuote": "Exact sentence spoken in transcript"
    }
  ],
  "decisions": [
    {
      "statement": "Decision reached",
      "decisionType": "confirmed" | "proposed",
      "decisionMaker": "Name or null",
      "evidenceQuote": "Exact sentence spoken in transcript"
    }
  ],
  "openQuestions": [
    {
      "question": "Unresolved question or blocker",
      "raisedBy": "Name or null",
      "addressedTo": "Name or null",
      "evidenceQuote": "Exact sentence spoken in transcript"
    }
  ]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey.trim()}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1 // Low temperature for high factual precision
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Empty response from Gemini API');
    }

    const parsedJson = JSON.parse(candidateText);

    // Normalize and run ambiguity analysis on all items
    const actionItems = (parsedJson.actionItems || []).map((item, idx) => {
      const act = {
        id: `act-${idx + 1}`,
        type: 'action_item',
        title: item.title,
        assignee: item.assignee || null,
        deadline: item.deadline || null,
        priority: item.priority || 'medium',
        status: 'pending_review',
        evidenceQuote: item.evidenceQuote || item.title,
        evidenceLine: findEvidenceLine(item.evidenceQuote, parsedTurns),
        speaker: item.assignee || 'Unknown',
        isEdited: false
      };
      const ambiguity = analyzeAmbiguity(act);
      act.ambiguityFlags = ambiguity.flags;
      act.confidenceScore = ambiguity.confidenceScore;
      act.needsHumanReview = ambiguity.needsHumanReview;
      return act;
    });

    const decisions = (parsedJson.decisions || []).map((item, idx) => {
      const dec = {
        id: `dec-${idx + 1}`,
        type: 'decision',
        title: item.statement,
        statement: item.statement,
        decisionType: item.decisionType || 'confirmed',
        decisionMaker: item.decisionMaker || null,
        approved: item.decisionType === 'confirmed',
        evidenceQuote: item.evidenceQuote || item.statement,
        evidenceLine: findEvidenceLine(item.evidenceQuote, parsedTurns)
      };
      const ambiguity = analyzeAmbiguity(dec);
      dec.ambiguityFlags = ambiguity.flags;
      dec.confidenceScore = ambiguity.confidenceScore;
      dec.needsHumanReview = ambiguity.needsHumanReview;
      return dec;
    });

    const openQuestions = (parsedJson.openQuestions || []).map((item, idx) => ({
      id: `que-${idx + 1}`,
      type: 'open_question',
      title: item.question,
      question: item.question,
      raisedBy: item.raisedBy || 'Unknown',
      addressedTo: item.addressedTo || null,
      status: 'open',
      evidenceQuote: item.evidenceQuote || item.question,
      evidenceLine: findEvidenceLine(item.evidenceQuote, parsedTurns)
    }));

    return {
      actionItems,
      decisions,
      openQuestions,
      sourceEngine: 'gemini_2_0_flash'
    };

  } catch (err) {
    console.warn('[GeminiExtractor] LLM extraction failed, falling back to heuristic engine:', err.message);
    const fallbackResult = extractExecutionItemsHeuristically(parsedTurns, speakers);
    return {
      ...fallbackResult,
      sourceEngine: 'heuristic_fallback_due_to_error',
      apiError: err.message
    };
  }
}

/**
 * Finds the corresponding line number in parsed turns for an evidence quote.
 */
function findEvidenceLine(quote, turns) {
  if (!quote || !turns.length) return 1;
  const quoteLower = quote.toLowerCase().slice(0, 30);
  for (const turn of turns) {
    if (turn.text.toLowerCase().includes(quoteLower) || turn.raw.toLowerCase().includes(quoteLower)) {
      return turn.startLine;
    }
  }
  return 1;
}
