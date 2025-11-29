import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import dictionary from './dictionary.json';
import { isSafeToTranslate } from './utils/safeReplace';

/**
 * Translates JavaScript/TypeScript/JSX/TSX files using AST parsing.
 * Only translates safe static string literals, not template literals with variables.
 * 
 * @param content - The source code content as string
 * @param cache - Optional cache for translations
 * @returns Translated source code as string
 */
export function translateStrings(
  content: string,
  cache?: Map<string, string>
): string {
  const dict = dictionary as Record<string, string>;
  
  // Parse the code with acorn
  // Support JSX by using ecmaVersion 2020 and sourceType module
  let ast: acorn.Node;
  try {
    ast = acorn.parse(content, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true,
      ranges: true,
    });
  } catch (error) {
    // If parsing fails, return original content
    console.warn(`Failed to parse code, skipping translation: ${error}`);
    return content;
  }
  
  // Collect all string literals that need translation
  const replacements: Array<{ start: number; end: number; replacement: string }> = [];
  
  // Walk the AST to find string literals
  walk.simple(ast, {
    Literal(node: any) {
      // Only process string literals
      if (typeof node.value === 'string') {
        const stringValue = node.value;
        
        // Skip empty strings
        if (!stringValue || stringValue.trim().length === 0) {
          return;
        }
        
        // Check if safe to translate
        if (!isSafeToTranslate(stringValue)) {
          return;
        }
        
        // Get translation
        let translation = stringValue;
        
        // Check cache first
        if (cache && cache.has(stringValue)) {
          translation = cache.get(stringValue)!;
        } else {
          // Look up in dictionary
          if (dict[stringValue]) {
            translation = dict[stringValue];
            // Store in cache
            if (cache) {
              cache.set(stringValue, translation);
            }
          } else {
            // Try word-by-word for multi-word strings
            const words = stringValue.split(/\s+/);
            const translatedWords = words.map((word: string) => {
              const cleanWord = word.replace(/[.,;:!?()]/g, '');
              if (dict[cleanWord]) {
                return word.replace(cleanWord, dict[cleanWord]);
              }
              return word;
            });
            translation = translatedWords.join(' ');
          }
        }
        
        // Only add replacement if translation is different
        if (translation !== stringValue && node.range) {
          replacements.push({
            start: node.range[0],
            end: node.range[1],
            replacement: translation
          });
        }
      }
    }
  });
  
  // Apply replacements in reverse order to maintain correct positions
  replacements.sort((a, b) => b.start - a.start);
  
  let result = content;
  for (const replacement of replacements) {
    const before = result.substring(0, replacement.start);
    const after = result.substring(replacement.end);
    
    // For string literals, we need to preserve the quotes
    // Check what type of quotes were used
    const original = content.substring(replacement.start, replacement.end);
    let quoteType = '';
    if (original.startsWith('"')) {
      quoteType = '"';
    } else if (original.startsWith("'")) {
      quoteType = "'";
    } else if (original.startsWith('`')) {
      quoteType = '`';
    }
    
    // Escape the translation if needed
    let escapedTranslation = replacement.replacement;
    if (quoteType === '"') {
      escapedTranslation = escapedTranslation.replace(/"/g, '\\"');
    } else if (quoteType === "'") {
      escapedTranslation = escapedTranslation.replace(/'/g, "\\'");
    } else if (quoteType === '`') {
      escapedTranslation = escapedTranslation.replace(/`/g, '\\`');
      escapedTranslation = escapedTranslation.replace(/\${/g, '\\${');
    }
    
    result = before + quoteType + escapedTranslation + quoteType + after;
  }
  
  // Handle JSX text content using regex (acorn doesn't support JSX natively)
  // Match text between JSX tags, but not inside script/style tags or JS expressions
  result = result.replace(/>([^<{]+)</g, (match, textContent, offset) => {
    // Skip if this looks like it's inside a script or style tag
    const beforeMatch = result.substring(0, offset);
    const lastScript = beforeMatch.lastIndexOf('<script');
    const lastStyle = beforeMatch.lastIndexOf('<style');
    const lastScriptClose = beforeMatch.lastIndexOf('</script>');
    const lastStyleClose = beforeMatch.lastIndexOf('</style>');
    
    if ((lastScript > lastScriptClose) || (lastStyle > lastStyleClose)) {
      return match; // Inside script or style tag, skip
    }
    
    // Check if this is JSX text (between > and <, not inside quotes or expressions)
    const trimmed = textContent.trim();
    if (!trimmed || !isSafeToTranslate(trimmed)) {
      return match;
    }
    
    // Get translation
    let translation = trimmed;
    
    // Check cache first
    if (cache && cache.has(trimmed)) {
      translation = cache.get(trimmed)!;
    } else {
      // Look up in dictionary
      if (dict[trimmed]) {
        translation = dict[trimmed];
        if (cache) {
          cache.set(trimmed, translation);
        }
      }
    }
    
    // Preserve whitespace
    const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
    const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
    
    return `>${leadingWhitespace}${translation}${trailingWhitespace}<`;
  });
  
  return result;
}

