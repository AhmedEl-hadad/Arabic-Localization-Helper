import * as fs from 'fs/promises';
import * as path from 'path';
import dictionary from '../dictionary.json';
import { getToolRoot } from './detectRoot';

function getCachedWordsPath(): string {
  const toolRoot = getToolRoot();
  return path.join(toolRoot, 'src', 'cached_words.json');
}

function getDictionaryPath(): string {
  const toolRoot = getToolRoot();
  return path.join(toolRoot, 'src', 'dictionary.json');
}

/**
 * Loads cached words from cached_words.json
 * Returns empty object if file doesn't exist
 */
export async function loadCachedWords(): Promise<Record<string, string>> {
  try {
    const cachedWordsPath = getCachedWordsPath();
    const content = await fs.readFile(cachedWordsPath, 'utf-8');
    const cached = JSON.parse(content);
    return typeof cached === 'object' && cached !== null ? cached : {};
  } catch (error) {
    // File doesn't exist or is invalid - return empty object
    return {};
  }
}

/**
 * Saves cached words to cached_words.json
 */
export async function saveCachedWords(data: Record<string, string>): Promise<void> {
  try {
    const cachedWordsPath = getCachedWordsPath();
    await fs.writeFile(cachedWordsPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn(`Failed to save cached words: ${error}`);
    throw error;
  }
}

/**
 * Appends new translations to existing cached_words.json
 * Merges with existing data
 */
export async function appendToCachedWords(newTranslations: Record<string, string>): Promise<void> {
  const existing = await loadCachedWords();
  const merged = { ...existing, ...newTranslations };
  await saveCachedWords(merged);
}

/**
 * Loads and merges dictionary.json and cached_words.json into a single map
 * Returns the merged dictionary
 */
export async function loadMergedDictionary(): Promise<Record<string, string>> {
  const mainDict = dictionary as Record<string, string>;
  const cachedWords = await loadCachedWords();
  
  // Merge: cached_words takes precedence over main dictionary
  return { ...mainDict, ...cachedWords };
}

/**
 * Merges new AI translations into the main dictionary.json file
 * This makes AI translations permanent in the dictionary
 * @param newTranslations - Record of English to Arabic translations from AI
 */
export async function mergeToMainDictionary(newTranslations: Record<string, string>): Promise<void> {
  if (Object.keys(newTranslations).length === 0) {
    return; // Nothing to merge
  }

  try {
    const dictionaryPath = getDictionaryPath();
    
    // Read existing dictionary
    let existingDict: Record<string, string> = {};
    try {
      const content = await fs.readFile(dictionaryPath, 'utf-8');
      existingDict = JSON.parse(content);
      if (typeof existingDict !== 'object' || existingDict === null || Array.isArray(existingDict)) {
        existingDict = {};
      }
    } catch (error) {
      // Dictionary file doesn't exist or is invalid, start with empty dict
      console.warn(`Warning: Could not read dictionary.json, starting fresh: ${error}`);
      existingDict = {};
    }
    
    // Merge new translations into existing dictionary
    // New translations take precedence (overwrite existing entries)
    const mergedDict = { ...existingDict, ...newTranslations };
    
    // Write back to dictionary.json
    await fs.writeFile(dictionaryPath, JSON.stringify(mergedDict, null, 2), 'utf-8');
    console.log(`✓ Merged ${Object.keys(newTranslations).length} translation(s) into dictionary.json`);
  } catch (error) {
    console.warn(`Failed to merge translations into dictionary.json: ${error}`);
    throw error;
  }
}

