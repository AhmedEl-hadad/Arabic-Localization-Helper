/**
 * Safe string replacement utilities that use word boundaries
 * to avoid breaking code patterns when translating strings.
 */

/**
 * Checks if a string should be translated based on safety rules.
 * 
 * @param text - The text to check
 * @param dict - Optional dictionary to check if word exists (if in dict, allow translation even if looks like identifier)
 * @returns true if the text is safe to translate, false otherwise
 */
export function isSafeToTranslate(text: string, dict?: Record<string, string>): boolean {
  // #region agent log
  const logData = { text, textLength: text?.length, hasDict: !!dict };
  // #endregion
  // Skip empty strings
  if (!text || text.trim().length === 0) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:15',message:'word skipped - empty',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return false;
  }
  
  // Skip strings that look like URLs
  if (/^https?:\/\//i.test(text) || /^www\./i.test(text) || /^[a-z]+:\/\//i.test(text)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:20',message:'word skipped - URL',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return false;
  }
  
  // Skip strings that contain code patterns (common indicators)
  if (text.includes('${') || text.includes('function(') || 
      text.includes('=>') || text.includes('()') || text.includes('{}')) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:25',message:'word skipped - code pattern',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return false;
  }
  
  // Skip strings that are purely numeric or special characters
  if (/^[\d\s\-_.,;:!?()]+$/.test(text)) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:31',message:'word skipped - numeric/special',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return false;
  }
  
  // If dictionary is provided and word exists in it, allow translation
  // (even if it looks like an identifier - it's clearly meant to be translated)
  if (dict && dict[text]) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:37',message:'word allowed - in dict',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return true;
  }
  
  // Check lowercase version for case-insensitive matching
  if (dict) {
    const lowerText = text.toLowerCase();
    if (dict[lowerText]) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:44',message:'word allowed - in dict (lowercase)',data:{...logData,lowerText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return true;
    }
  }
  
  // Skip strings that look like identifiers (camelCase, snake_case, etc.)
  // BUT allow capitalized single words (PascalCase) that aren't in dictionary - they might be proper nouns/titles
  // that should be translated by AI
  if (/^[a-z][a-zA-Z0-9_]*$/.test(text)) {
    // Lowercase camelCase - likely code identifier, reject
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:52',message:'word skipped - camelCase identifier',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return false;
  }
  
  // For PascalCase (capitalized) words:
  if (/^[A-Z][a-zA-Z0-9_]*$/.test(text)) {
    // If it contains numbers or underscores, it's likely code - reject
    if (/\d/.test(text) || text.includes('_')) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:60',message:'word skipped - PascalCase with numbers/underscore',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return false;
    }
    // Pure capitalized word (no numbers/underscores) - allow it even if not in dict
    // This allows proper nouns/titles to be collected for AI translation
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:65',message:'word allowed - PascalCase',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return true;
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'safeReplace.ts:68',message:'word allowed - default',data:logData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  return true;
}

/**
 * Replaces text using word boundaries to avoid partial matches.
 * This ensures we don't break code by replacing parts of words.
 * 
 * @param text - The text to search in
 * @param search - The text to find
 * @param replace - The replacement text
 * @returns The text with replacements made
 */
export function replaceWithWordBoundary(text: string, search: string, replace: string): string {
  // Escape special regex characters in search string
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Use word boundary regex to match whole words only
  // \b matches word boundaries (between word and non-word characters)
  const regex = new RegExp(`\\b${escapedSearch}\\b`, 'gi');
  
  return text.replace(regex, replace);
}

/**
 * Checks if a string contains only whitespace
 * @param text - The text to check
 * @returns true if text is only whitespace
 */
export function isWhitespaceOnly(text: string): boolean {
  return /^\s*$/.test(text);
}

