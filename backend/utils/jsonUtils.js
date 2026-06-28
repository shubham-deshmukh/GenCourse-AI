// Helper to mathematically repair truncated JSON structures (e.g. unclosed strings, braces, or brackets)
export const repairTruncatedJSON = (jsonString) => {
  if (!jsonString) return '';
  let str = jsonString.trim();
  if (!str.startsWith('{') && !str.startsWith('[')) return str;

  let stack = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  // Handle trailing escape char
  if (escaped) {
    str = str.slice(0, -1);
  }

  // Close open string
  if (inString) {
    str += '"';
  }

  // Close open brackets/braces in reverse order
  while (stack.length > 0) {
    const last = stack.pop();
    str = str.trim();
    // Remove trailing commas or colons
    str = str.replace(/,$/, '').replace(/:$/, ': null');
    if (last === '{') {
      str += '}';
    } else if (last === '[') {
      str += ']';
    }
  }

  return str;
};

/**
 * Parses JSON strictly, and if it fails due to trailing non-whitespace characters,
 * slices the string at the position of the failure and retries parsing.
 * @param {string} str
 * @returns {any}
 */
export const parseJSONStrictOrLoose = (str) => {
  let tempStr = str.trim();
  while (true) {
    try {
      return JSON.parse(tempStr);
    } catch (err) {
      const match = err.message.match(/Unexpected non-whitespace character after JSON at position (\d+)/);
      if (match) {
        const pos = parseInt(match[1], 10);
        tempStr = tempStr.substring(0, pos).trim();
      } else {
        throw err;
      }
    }
  }
};

/**
 * Safe JSON parser that strips markdown wrappers, extracts JSON blocks,
 * and attempts repair on truncated inputs or cleans trailing notes.
 * @param {string} text
 * @returns {any}
 */
export const parseJSONSafely = (text) => {
  if (!text) return null;
  let cleanText = text.trim();

  // Remove markdown code block wrappers if they exist
  cleanText = cleanText.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();

  // Find first { to extract JSON block
  const startIdx = cleanText.indexOf('{');
  if (startIdx !== -1) {
    const endIdx = cleanText.lastIndexOf('}');
    if (endIdx !== -1 && endIdx > startIdx) {
      try {
        const potentialJSON = cleanText.substring(startIdx, endIdx + 1);
        return parseJSONStrictOrLoose(potentialJSON);
      } catch (err) {
        // Substring parse failed (e.g. the last } found wasn't matching the outer structure or it was truncated later)
        try {
          const truncatedPart = cleanText.substring(startIdx);
          const repaired = repairTruncatedJSON(truncatedPart);
          return parseJSONStrictOrLoose(repaired);
        } catch (repairErr) {
          console.error('Failed parsing repaired JSON:', repairErr.message);
        }
      }
    } else {
      // Missing final brace (definitely truncated)
      try {
        const truncatedPart = cleanText.substring(startIdx);
        const repaired = repairTruncatedJSON(truncatedPart);
        return parseJSONStrictOrLoose(repaired);
      } catch (repairErr) {
        console.error('Failed parsing repaired JSON:', repairErr.message);
      }
    }
  }

  return parseJSONStrictOrLoose(cleanText);
};
