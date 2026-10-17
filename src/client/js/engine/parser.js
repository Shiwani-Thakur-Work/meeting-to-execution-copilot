/**
 * parser.js
 * 
 * Transcript Normalizer & Speaker Turn Tokenizer.
 * Ingests unstructured meeting transcripts, identifies conversational turns,
 * extracts speaker identities and timestamps, and builds an index of lines
 * to enable bidirectional source-evidence navigation.
 */

/**
 * Parses raw transcript text into structured conversational turns.
 * @param {string} rawText 
 * @returns {{ turns: Array, speakers: string[], lines: string[], textLength: number }}
 */
export function parseTranscript(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { turns: [], speakers: [], lines: [], textLength: 0 };
  }

  // Split into raw lines while preserving line indices
  const rawLines = rawText.split(/\r?\n/);
  const turns = [];
  const speakersSet = new Set();

  // Common regex patterns for meeting transcript turns:
  // 1. "Alex (10:04 AM): text..."
  // 2. "[10:04] Alex: text..."
  // 3. "Alex [10:04 AM] - text..."
  // 4. "Alex: text..."
  const TURN_PATTERNS = [
    // Alex (10:04 AM): Hello
    /^([A-Za-z0-9_.\s]+?)\s*\(([^)]+)\)\s*:\s*(.+)$/,
    // [10:04] Alex: Hello
    /^\[([^\]]+)\]\s*([A-Za-z0-9_.\s]+?)\s*:\s*(.+)$/,
    // Alex [10:04] - Hello
    /^([A-Za-z0-9_.\s]+?)\s*\[([^\]]+)\]\s*[-:]\s*(.+)$/,
    // Alex: Hello
    /^([A-Za-z0-9_.\s]{2,30}?)\s*:\s*(.+)$/
  ];

  let currentTurn = null;

  rawLines.forEach((lineText, lineIndex) => {
    const trimmed = lineText.trim();
    if (!trimmed) return;

    let matched = false;

    // Pattern 1: Name (timestamp): text
    let m = trimmed.match(TURN_PATTERNS[0]);
    if (m) {
      const speaker = cleanSpeakerName(m[1]);
      const timestamp = m[2].trim();
      const speech = m[3].trim();
      currentTurn = createTurn(lineIndex + 1, speaker, timestamp, speech, lineText);
      turns.push(currentTurn);
      speakersSet.add(speaker);
      matched = true;
    }

    // Pattern 2: [timestamp] Name: text
    if (!matched) {
      m = trimmed.match(TURN_PATTERNS[1]);
      if (m) {
        const timestamp = m[1].trim();
        const speaker = cleanSpeakerName(m[2]);
        const speech = m[3].trim();
        currentTurn = createTurn(lineIndex + 1, speaker, timestamp, speech, lineText);
        turns.push(currentTurn);
        speakersSet.add(speaker);
        matched = true;
      }
    }

    // Pattern 3: Name [timestamp] - text
    if (!matched) {
      m = trimmed.match(TURN_PATTERNS[2]);
      if (m) {
        const speaker = cleanSpeakerName(m[1]);
        const timestamp = m[2].trim();
        const speech = m[3].trim();
        currentTurn = createTurn(lineIndex + 1, speaker, timestamp, speech, lineText);
        turns.push(currentTurn);
        speakersSet.add(speaker);
        matched = true;
      }
    }

    // Pattern 4: Name: text (avoid URL or JSON keys by checking length and punctuation)
    if (!matched) {
      m = trimmed.match(TURN_PATTERNS[3]);
      if (m && !m[1].toLowerCase().startsWith('http') && !m[1].includes('{') && m[1].split(' ').length <= 4) {
        const speaker = cleanSpeakerName(m[1]);
        const speech = m[2].trim();
        currentTurn = createTurn(lineIndex + 1, speaker, null, speech, lineText);
        turns.push(currentTurn);
        speakersSet.add(speaker);
        matched = true;
      }
    }

    // If continuation line of ongoing speaker
    if (!matched) {
      if (currentTurn) {
        currentTurn.text += ' ' + trimmed;
        currentTurn.endLine = lineIndex + 1;
      } else {
        // Fallback for lines before any speaker label
        currentTurn = createTurn(lineIndex + 1, 'Unknown Speaker', null, trimmed, lineText);
        turns.push(currentTurn);
      }
    }
  });

  return {
    turns,
    speakers: Array.from(speakersSet),
    lines: rawLines,
    textLength: rawText.length
  };
}

/**
 * Creates a normalized Turn entity.
 */
function createTurn(lineNumber, speaker, timestamp, text, rawLine) {
  return {
    id: `turn-${lineNumber}`,
    startLine: lineNumber,
    endLine: lineNumber,
    speaker: speaker || 'Unknown Speaker',
    timestamp: timestamp || null,
    text: text || '',
    raw: rawLine
  };
}

/**
 * Sanitizes speaker strings, removing unwanted trailing symbols.
 */
function cleanSpeakerName(name) {
  return name.replace(/^[-\s*]+|[-\s*]+$/g, '').trim();
}
