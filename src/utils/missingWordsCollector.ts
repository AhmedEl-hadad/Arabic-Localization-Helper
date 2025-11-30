import * as fs from 'fs/promises';
import * as path from 'path';
import { readFileSafe } from './fileManager';
import { isSafeToTranslate, isWhitespaceOnly } from './safeReplace';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/**
 * Extracts translatable strings from file content based on file type
 */
async function extractTranslatableStrings(
  content: string,
  filePath: string,
  dict: Record<string, string>
): Promise<Set<string>> {
  const missingWords = new Set<string>();
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    // Extract strings from JSON
    try {
      const data = JSON.parse(content);
      extractFromJsonObject(data, dict, missingWords);
    } catch {
      // Invalid JSON, skip
    }
  } else if (ext === '.html' || ext === '.htm') {
    // Extract from HTML: text content and specific attributes
    extractFromHtml(content, dict, missingWords);
  } else if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
    // Extract from JavaScript/TypeScript using AST
    extractFromJavaScript(content, dict, missingWords);
  }

  return missingWords;
}

/**
 * Recursively extracts strings from JSON object
 */
function extractFromJsonObject(
  obj: any,
  dict: Record<string, string>,
  missingWords: Set<string>
): void {
  if (typeof obj === 'string') {
    if (isSafeToTranslate(obj, dict)) {
      // Check exact match first
      if (!dict[obj]) {
        missingWords.add(obj);
        }
      
      // Also check word-by-word (matching translation logic)
      const words = obj.split(/\s+/);
      words.forEach((word: string) => {
        // Check exact word match
        if (word && isSafeToTranslate(word, dict) && !dict[word]) {
          missingWords.add(word);
          }
        
        // Check clean word match (same pattern as translation)
        const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
        if (cleanWord && cleanWord !== word && isSafeToTranslate(cleanWord, dict) && !dict[cleanWord]) {
          missingWords.add(cleanWord);
          }
      });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => extractFromJsonObject(item, dict, missingWords));
  } else if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(value => extractFromJsonObject(value, dict, missingWords));
  }
}

/**
 * Extracts translatable strings from HTML content
 */
function extractFromHtml(
  content: string,
  dict: Record<string, string>,
  missingWords: Set<string>
): void {
  // Extract text content between tags
  content.replace(/>([^<]+)</g, (match, textContent) => {
    const trimmed = textContent.trim();
    if (trimmed && isSafeToTranslate(trimmed, dict)) {
      // Check exact match
      if (!dict[trimmed]) {
        missingWords.add(trimmed);
      }
      
      // Also check word-by-word
      const words = trimmed.split(/\s+/);
      words.forEach((word: string) => {
        if (word && isSafeToTranslate(word, dict) && !dict[word]) {
          missingWords.add(word);
        }
        const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
        if (cleanWord && cleanWord !== word && isSafeToTranslate(cleanWord, dict) && !dict[cleanWord]) {
          missingWords.add(cleanWord);
        }
      });
    }
    return match;
  });

  // Extract from alt, title, placeholder, aria-label attributes
  const attributePatterns = [
    /alt\s*=\s*["']([^"']*)["']/gi,
    /title\s*=\s*["']([^"']*)["']/gi,
    /placeholder\s*=\s*["']([^"']*)["']/gi,
    /aria-label\s*=\s*["']([^"']*)["']/gi
  ];

  attributePatterns.forEach(pattern => {
    content.replace(pattern, (match, attrValue) => {
      if (attrValue && isSafeToTranslate(attrValue, dict)) {
        // Check exact match
        if (!dict[attrValue]) {
          missingWords.add(attrValue);
        }
        
        // Also check word-by-word
        const words = attrValue.split(/\s+/);
        words.forEach((word: string) => {
          if (word && isSafeToTranslate(word, dict) && !dict[word]) {
            missingWords.add(word);
          }
          const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
          if (cleanWord && cleanWord !== word && isSafeToTranslate(cleanWord, dict) && !dict[cleanWord]) {
            missingWords.add(cleanWord);
          }
        });
      }
      return match;
    });
  });
}

/**
 * Extracts translatable strings from JavaScript/TypeScript using AST
 */
function extractFromJavaScript(
  content: string,
  dict: Record<string, string>,
  missingWords: Set<string>
): void {
  try {
    const ast = acorn.parse(content, {
      ecmaVersion: 2020,
      sourceType: 'module',
      locations: true,
      ranges: true,
    });

    walk.simple(ast, {
      Literal(node: any) {
        if (typeof node.value === 'string') {
          const stringValue = node.value;
          if (stringValue && isSafeToTranslate(stringValue, dict)) {
            // Check exact match first
            if (!dict[stringValue]) {
              missingWords.add(stringValue);
            }
            
            // Also check word-by-word (matching translation logic)
            const words = stringValue.split(/\s+/);
            words.forEach((word: string) => {
              // Check exact word match
              if (word && isSafeToTranslate(word, dict) && !dict[word]) {
                missingWords.add(word);
              }
              
              // Check clean word match (same pattern as translation)
              const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
              if (cleanWord && cleanWord !== word && isSafeToTranslate(cleanWord, dict) && !dict[cleanWord]) {
                missingWords.add(cleanWord);
              }
            });
          }
        }
      }
    });
  } catch {
    // Parse failed, skip
  }
}

/**
 * Collects missing words from all files by pre-scanning them
 * Returns a set of unique missing words/phrases
 */
export async function collectMissingWords(
  files: string[],
  projectRoot: string,
  dict: Record<string, string>
): Promise<Set<string>> {
  const allMissingWords = new Set<string>();

  // Filter to only text translation files (exclude CSS)
  const textFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext !== '.css' && ext !== '.scss' && ext !== '.less';
  });

  for (const filePath of textFiles) {
    try {
      const content = await readFileSafe(filePath, projectRoot);
      const missing = await extractTranslatableStrings(content, filePath, dict);
      missing.forEach((word: string) => allMissingWords.add(word));
      } catch (error) {
      // Skip files that can't be read
      console.warn(`Warning: Could not read file for missing words collection: ${filePath}`);
    }
  }

  return allMissingWords;
}

/**
 * Saves missing words to a temporary JSON file
 * Format: { "word1": "", "word2": "", ... }
 */
export async function saveMissingWords(
  words: Set<string>,
  tempPath: string
): Promise<void> {
  // Ensure temp directory exists
  const tempDir = path.dirname(tempPath);
  await fs.mkdir(tempDir, { recursive: true });

  // Convert set to object with empty values
  const wordsObj: Record<string, string> = {};
  words.forEach((word: string) => {
    wordsObj[word] = '';
  });

  await fs.writeFile(tempPath, JSON.stringify(wordsObj, null, 2), 'utf-8');
}

/**
 * Deletes the temporary missing words file
 */
export async function deleteTempFile(tempPath: string): Promise<void> {
  try {
    await fs.unlink(tempPath);
  } catch (error) {
    // File doesn't exist or already deleted - ignore
  }
}

