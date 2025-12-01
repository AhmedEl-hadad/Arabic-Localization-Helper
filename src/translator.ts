import * as path from 'path';
import { translateJson } from './translateJson';
import { translateHtml } from './translateHtml';
import { translateStrings } from './translateStrings';
import { translateCss } from './translateCss';
import { readFileSafe, writeFileSafe, getOutputPath, isWithinProjectRoot } from './utils/fileManager';
import { getProjectRoot, getToolRoot } from './utils/detectRoot';
import { loadMergedDictionary, appendToCachedWords, mergeToMainDictionary } from './utils/dictionaryLoader';
import { collectMissingWords, saveMissingWords, deleteTempFile } from './utils/missingWordsCollector';
import { translateMissingWords } from './services/aiTranslator';
import { AI_ENABLED } from './config/ai';

/**
 * In-memory cache for translations
 * Key: original English text
 * Value: Arabic translation
 */
const translationCache = new Map<string, string>();

/**
 * Gets the translation cache
 * @returns The cache Map
 */
export function getCache(): Map<string, string> {
  return translationCache;
}

/**
 * Clears the translation cache
 */
export function clearCache(): void {
  translationCache.clear();
}

/**
 * Detects the file type based on extension and routes to appropriate translator
 * @param filePath - Absolute path to the file
 * @returns The file type: 'json', 'html', 'js', 'css', or 'unknown'
 */
function detectFileType(filePath: string): 'json' | 'html' | 'js' | 'css' | 'unknown' {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.json') {
    return 'json';
  }
  
  if (ext === '.html' || ext === '.htm') {
    return 'html';
  }
  
  if (ext === '.js' || ext === '.ts' || ext === '.jsx' || ext === '.tsx') {
    return 'js';
  }
  
  if (ext === '.css' || ext === '.scss' || ext === '.less') {
    return 'css';
  }
  
  return 'unknown';
}

/**
 * Translates a single file based on its type.
 * Reads file, translates, and writes output.
 * 
 * @param filePath - Absolute path to the file to translate
 * @param projectRoot - Optional project root for boundary checking
 * @returns Promise that resolves when translation is complete
 */
export async function translateFile(
  filePath: string,
  projectRoot?: string
): Promise<void> {
  // Load merged dictionary for this file
  const mergedDict = await loadMergedDictionary();
  await translateFileWithDict(filePath, projectRoot, mergedDict);
}

/**
 * Translates a single file with a provided dictionary.
 * Internal function used by translateFiles after AI processing.
 * 
 * @param filePath - Absolute path to the file to translate
 * @param projectRoot - Optional project root for boundary checking
 * @param dict - Dictionary to use for translation
 * @returns Promise that resolves when translation is complete
 */
async function translateFileWithDict(
  filePath: string,
  projectRoot: string | undefined,
  dict: Record<string, string>
): Promise<void> {
  try {
    // CRITICAL: Reject files outside the project root
    const actualProjectRoot = projectRoot || getProjectRoot();
    if (!isWithinProjectRoot(filePath, actualProjectRoot)) {
      throw new Error(`File is outside project root: ${filePath}`);
    }
    
    // Detect file type
    const fileType = detectFileType(filePath);
    
    if (fileType === 'unknown') {
      throw new Error(`Unsupported file type: ${filePath}`);
    }
    
    // Read file content (includes boundary check)
    const content = await readFileSafe(filePath, actualProjectRoot);
    
    // Handle CSS files separately (they don't use text translation)
    if (fileType === 'css') {
      await translateCss(filePath, actualProjectRoot);
      console.log(`✓ Translated: ${path.basename(filePath)} → ${path.basename(getOutputPath(filePath))}`);
      return;
    }
    
    // Translate based on file type
    let translatedContent: string;
    
    switch (fileType) {
      case 'json':
        translatedContent = translateJson(content, translationCache, dict);
        break;
        
      case 'html':
        translatedContent = translateHtml(content, translationCache, dict);
        break;
        
      case 'js':
        translatedContent = translateStrings(content, translationCache, dict);
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Generate output path
    const outputPath = getOutputPath(filePath);
    
    // Ensure output path is also within project root
    if (!isWithinProjectRoot(outputPath, actualProjectRoot)) {
      throw new Error(`Output path is outside project root: ${outputPath}`);
    }
    
    // Write translated content
    await writeFileSafe(outputPath, translatedContent);
    
    console.log(`✓ Translated: ${path.basename(filePath)} → ${path.basename(outputPath)}`);
    
  } catch (error) {
    console.error(`✗ Failed to translate ${filePath}: ${error}`);
    throw error;
  }
}

/**
 * Translates multiple files
 * Processes text translation files first, then CSS files
 * @param filePaths - Array of absolute paths to files
 * @param projectRoot - Optional project root for boundary checking
 * @returns Promise that resolves when all translations are complete
 */
export async function translateFiles(
  filePaths: string[],
  projectRoot?: string
): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:163',message:'translateFiles entry',data:{fileCount:filePaths.length,firstFewFiles:filePaths.slice(0,5),projectRoot},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  let successCount = 0;
  let failCount = 0;
  
  const actualProjectRoot = projectRoot || getProjectRoot();
  const toolRoot = getToolRoot();
  const tempFilePath = path.join(toolRoot, 'src', 'temp', 'missing_words.json');
  
  try {
    // Step 1: Load merged dictionary (dictionary + cached_words)
    let mergedDict = await loadMergedDictionary();
    // Step 2: Pre-scan phase - collect missing words
    console.log('\nPre-scanning files for missing words...');
    const missingWords = await collectMissingWords(filePaths, actualProjectRoot, mergedDict);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:179',message:'missing words collected',data:{missingWordsCount:missingWords.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Step 3: AI translation if enabled and missing words exist
    if (AI_ENABLED && missingWords.size > 0) {
      console.log(`Found ${missingWords.size} missing word(s). Attempting AI translation...`);
      
      try {
        // Save missing words to temp file
        await saveMissingWords(missingWords, tempFilePath);
        
        // Call AI translator
        const aiTranslations = await translateMissingWords();
        if (Object.keys(aiTranslations).length > 0) {
          // Append AI translations to cached_words.json
          await appendToCachedWords(aiTranslations);
          console.log(`✓ AI translated ${Object.keys(aiTranslations).length} word(s). Added to dictionary.`);
          
          // Merge AI translations into main dictionary.json for permanent storage
          await mergeToMainDictionary(aiTranslations);
          // Track words that were requested but not translated by AI
          const requestedWords = Array.from(missingWords);
          const translatedWords = Object.keys(aiTranslations);
          const untranslatedWords = requestedWords.filter(word => !translatedWords.includes(word));
          
          if (untranslatedWords.length > 0) {
            console.warn(`⚠ Warning: ${untranslatedWords.length} word(s) were requested from AI but not returned:`);
            untranslatedWords.slice(0, 10).forEach(word => {
              console.warn(`  - "${word}"`);
            });
            if (untranslatedWords.length > 10) {
              console.warn(`  ... and ${untranslatedWords.length - 10} more`);
            }
            }
          
          // Reload merged dictionary with new translations
          mergedDict = await loadMergedDictionary();
          } else {
          console.log('No AI translations received. Continuing with dictionary-only mode.');
        }
      } catch (error) {
        console.warn(`AI translation failed: ${error}. Continuing with dictionary-only mode.`);
      } finally {
        // Always delete temp file
        await deleteTempFile(tempFilePath);
      }
    } else if (missingWords.size > 0) {
      console.log(`Found ${missingWords.size} missing word(s). AI translation is disabled.`);
    } else {
      console.log('All words found in dictionary. No AI translation needed.');
    }
    
    // Step 4: Continue with normal translation using updated dictionary
    // Separate CSS files from text translation files
    const textFiles: string[] = [];
    const cssFiles: string[] = [];
    
    for (const filePath of filePaths) {
      const fileType = detectFileType(filePath);
      if (fileType === 'css') {
        cssFiles.push(filePath);
      } else {
        textFiles.push(filePath);
      }
    }
    
    console.log(`\nTranslating ${filePaths.length} file(s)...\n`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:243',message:'starting translation loop',data:{textFilesCount:textFiles.length,cssFilesCount:cssFiles.length,totalFiles:filePaths.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Process text translation files first (with merged dictionary)
    for (const filePath of textFiles) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:247',message:'translating text file',data:{filePath,successCount,failCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        await translateFileWithDict(filePath, actualProjectRoot, mergedDict);
        successCount++;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:252',message:'text file translation error',data:{filePath,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        failCount++;
        // Continue with next file even if one fails
      }
    }
    
    // Process CSS files after text translations
    for (const filePath of cssFiles) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:259',message:'translating css file',data:{filePath,successCount,failCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      try {
        await translateFile(filePath, actualProjectRoot);
        successCount++;
      } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'translator.ts:264',message:'css file translation error',data:{filePath,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        failCount++;
        // Continue with next file even if one fails
      }
    }
    
    console.log(`\nTranslation complete: ${successCount} succeeded, ${failCount} failed`);
    console.log(`Cache size: ${translationCache.size} entries`);
    
  } catch (error) {
    // Ensure temp file is deleted even on error
    await deleteTempFile(tempFilePath);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * Translates a single JSON file (old API)
 * @param inputFilename - Relative filename from project root
 */
export function translate(inputFilename: string = 'input.json'): void {
  // This is the old synchronous API, kept for backward compatibility
  // New code should use translateFile or translateFiles instead
  console.warn('Warning: Using legacy translate() function. Consider using translateFile() instead.');
  
  const inputPath = path.join(process.cwd(), inputFilename);
  
  // Use the new async translateFile function
  translateFile(inputPath)
    .then(() => {
      console.log('Translation completed successfully!');
    })
    .catch((error) => {
      console.error('Error during translation:', error);
      process.exit(1);
    });
}
