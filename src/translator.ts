import * as path from 'path';
import { translateJson } from './translateJson';
import { translateHtml } from './translateHtml';
import { translateStrings } from './translateStrings';
import { readFileSafe, writeFileSafe, getOutputPath, isWithinProjectRoot } from './utils/fileManager';
import { getProjectRoot } from './utils/detectRoot';

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
 * @returns The file type: 'json', 'html', 'js', or 'unknown'
 */
function detectFileType(filePath: string): 'json' | 'html' | 'js' | 'unknown' {
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
    
    // Translate based on file type
    let translatedContent: string;
    
    switch (fileType) {
      case 'json':
        translatedContent = translateJson(content, translationCache);
        break;
        
      case 'html':
        translatedContent = translateHtml(content, translationCache);
        break;
        
      case 'js':
        translatedContent = translateStrings(content, translationCache);
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
 * @param filePaths - Array of absolute paths to files
 * @param projectRoot - Optional project root for boundary checking
 * @returns Promise that resolves when all translations are complete
 */
export async function translateFiles(
  filePaths: string[],
  projectRoot?: string
): Promise<void> {
  let successCount = 0;
  let failCount = 0;
  
  console.log(`\nTranslating ${filePaths.length} file(s)...\n`);
  
  for (const filePath of filePaths) {
    try {
      await translateFile(filePath, projectRoot);
      successCount++;
    } catch (error) {
      failCount++;
      // Continue with next file even if one fails
    }
  }
  
  console.log(`\nTranslation complete: ${successCount} succeeded, ${failCount} failed`);
  console.log(`Cache size: ${translationCache.size} entries`);
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
