import { isSafeToTranslate, replaceWithWordBoundary, isWhitespaceOnly } from './utils/safeReplace';

/**
 * Translates HTML content to Arabic.
 * Only translates:
 * - Inner text between tags
 * - alt, title, placeholder, aria-label attributes
 * 
 * Does NOT translate:
 * - class, id, href, src, style, data-*, JS event handlers
 * 
 * @param content - The HTML content as string
 * @param cache - Optional cache for translations
 * @param dict - The dictionary mapping English to Arabic (optional, will use default if not provided)
 * @returns Translated HTML content as string
 */
export function translateHtml(
  content: string,
  cache?: Map<string, string>,
  dict?: Record<string, string>
): string {
  // Use provided dictionary or fallback to default (for backward compatibility)
  const translationDict = dict || (require('./dictionary.json') as Record<string, string>);
  let result = content;
  
  // Add or update dir="rtl" and lang="ar" to <html> tag
  result = result.replace(/<html\s*([^>]*)>/i, (match, attributes) => {
    let updatedAttributes = attributes || '';
    
    // Update or add dir attribute
    if (/dir\s*=\s*["'][^"']*["']/i.test(updatedAttributes)) {
      updatedAttributes = updatedAttributes.replace(/dir\s*=\s*["'][^"']*["']/i, 'dir="rtl"');
    } else {
      updatedAttributes = updatedAttributes.trim() + (updatedAttributes.trim() ? ' ' : '') + 'dir="rtl"';
    }
    
    // Update or add lang attribute
    if (/lang\s*=\s*["'][^"']*["']/i.test(updatedAttributes)) {
      updatedAttributes = updatedAttributes.replace(/lang\s*=\s*["'][^"']*["']/i, 'lang="ar"');
    } else {
      updatedAttributes = updatedAttributes.trim() + (updatedAttributes.trim() ? ' ' : '') + 'lang="ar"';
    }
    
    return `<html ${updatedAttributes.trim()}>`;
  });
  
  /**
   * Translates a single text string using dictionary and cache
   */
  function translateText(text: string): string {
    if (!text || isWhitespaceOnly(text)) {
      return text;
    }
    
    // Check cache first
    if (cache && cache.has(text)) {
      const cached = cache.get(text)!;
      return cached;
    }
    
    // Check if safe to translate (pass dictionary to allow words in dict even if they look like identifiers)
    if (!isSafeToTranslate(text, translationDict)) {
      return text;
    }
    
    // Try exact match first
    let translated = translationDict[text];
    // Try lowercase version if exact match not found
    if (!translated) {
      const lowerText = text.toLowerCase();
      translated = translationDict[lowerText];
      }
    
    if (translated) {
      // Store in cache
      if (cache) {
        cache.set(text, translated);
      }
      return translated;
    }
    
    // Try word-by-word translation for multi-word strings
    const words = text.split(/\s+/);
    const translatedWords = words.map((word: string) => {
      // Try exact word match first
      if (translationDict[word]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translateHtml.ts:86',message:'word translated - exact match',data:{word,translation:translationDict[word]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return translationDict[word];
      }
      
      // Try lowercase version
      const lowerWord = word.toLowerCase();
      if (translationDict[lowerWord]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translateHtml.ts:92',message:'word translated - lowercase match',data:{word,lowerWord,translation:translationDict[lowerWord]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return translationDict[lowerWord];
      }
      
      // Remove punctuation for dictionary lookup
      const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
      
      // Try clean word match
      if (cleanWord && cleanWord !== word && translationDict[cleanWord]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translateHtml.ts:100',message:'word translated - clean match',data:{word,cleanWord,translation:translationDict[cleanWord]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        // Replace the clean word with translation, preserving punctuation
        return word.replace(cleanWord, translationDict[cleanWord]);
      }
      
      // Try clean word lowercase
      const cleanLowerWord = cleanWord.toLowerCase();
      if (cleanWord && cleanWord !== word && translationDict[cleanLowerWord]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translateHtml.ts:107',message:'word translated - clean lowercase match',data:{word,cleanWord,cleanLowerWord,translation:translationDict[cleanLowerWord]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        return word.replace(cleanWord, translationDict[cleanLowerWord]);
      }
      
      // Word not found, return original
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translateHtml.ts:112',message:'word NOT translated - not in dict',data:{word,cleanWord,checkedExact:!!translationDict[word],checkedLower:!!translationDict[lowerWord],checkedClean:!!translationDict[cleanWord],checkedCleanLower:!!translationDict[cleanLowerWord]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return word;
    });
    
    translated = translatedWords.join(' ');
    
    // Only cache if we actually translated something
    if (translated !== text && cache) {
      cache.set(text, translated);
    }
    
    return translated;
  }
  
  // Translate text content between tags
  // Match text nodes (not inside tags or script/style tags)
  result = result.replace(/>([^<]+)</g, (match, textContent) => {
    // Skip if this looks like it's inside a script or style tag
    const beforeMatch = result.substring(0, result.indexOf(match));
    const lastScript = beforeMatch.lastIndexOf('<script');
    const lastStyle = beforeMatch.lastIndexOf('<style');
    const lastScriptClose = beforeMatch.lastIndexOf('</script>');
    const lastStyleClose = beforeMatch.lastIndexOf('</style>');
    
    if ((lastScript > lastScriptClose) || (lastStyle > lastStyleClose)) {
      return match; // Inside script or style tag, skip
    }
    
    // Preserve whitespace around text
    const trimmed = textContent.trim();
    if (!trimmed || isWhitespaceOnly(trimmed)) {
      return match;
    }
    
    const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
    const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
    
    const translated = translateText(trimmed);
    return `>${leadingWhitespace}${translated}${trailingWhitespace}<`;
  });
  
  // Translate alt attributes
  result = result.replace(/alt\s*=\s*["']([^"']*)["']/gi, (match, altText) => {
    const translated = translateText(altText);
    return `alt="${translated}"`;
  });
  
  // Translate title attributes
  result = result.replace(/title\s*=\s*["']([^"']*)["']/gi, (match, titleText) => {
    const translated = translateText(titleText);
    return `title="${translated}"`;
  });
  
  // Translate placeholder attributes
  result = result.replace(/placeholder\s*=\s*["']([^"']*)["']/gi, (match, placeholderText) => {
    const translated = translateText(placeholderText);
    return `placeholder="${translated}"`;
  });
  
  // Translate aria-label attributes
  result = result.replace(/aria-label\s*=\s*["']([^"']*)["']/gi, (match, ariaLabelText) => {
    const translated = translateText(ariaLabelText);
    return `aria-label="${translated}"`;
  });
  
  return result;
}

