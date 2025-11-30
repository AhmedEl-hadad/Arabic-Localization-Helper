"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCache = getCache;
exports.clearCache = clearCache;
exports.translateFile = translateFile;
exports.translateFiles = translateFiles;
exports.translate = translate;
const path = __importStar(require("path"));
const translateJson_1 = require("./translateJson");
const translateHtml_1 = require("./translateHtml");
const translateStrings_1 = require("./translateStrings");
const translateCss_1 = require("./translateCss");
const fileManager_1 = require("./utils/fileManager");
const detectRoot_1 = require("./utils/detectRoot");
const dictionaryLoader_1 = require("./utils/dictionaryLoader");
const missingWordsCollector_1 = require("./utils/missingWordsCollector");
const aiTranslator_1 = require("./services/aiTranslator");
const ai_1 = require("./config/ai");
/**
 * In-memory cache for translations
 * Key: original English text
 * Value: Arabic translation
 */
const translationCache = new Map();
/**
 * Gets the translation cache
 * @returns The cache Map
 */
function getCache() {
    return translationCache;
}
/**
 * Clears the translation cache
 */
function clearCache() {
    translationCache.clear();
}
/**
 * Detects the file type based on extension and routes to appropriate translator
 * @param filePath - Absolute path to the file
 * @returns The file type: 'json', 'html', 'js', 'css', or 'unknown'
 */
function detectFileType(filePath) {
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
async function translateFile(filePath, projectRoot) {
    // Load merged dictionary for this file
    const mergedDict = await (0, dictionaryLoader_1.loadMergedDictionary)();
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
async function translateFileWithDict(filePath, projectRoot, dict) {
    try {
        // CRITICAL: Reject files outside the project root
        const actualProjectRoot = projectRoot || (0, detectRoot_1.getProjectRoot)();
        if (!(0, fileManager_1.isWithinProjectRoot)(filePath, actualProjectRoot)) {
            throw new Error(`File is outside project root: ${filePath}`);
        }
        // Detect file type
        const fileType = detectFileType(filePath);
        if (fileType === 'unknown') {
            throw new Error(`Unsupported file type: ${filePath}`);
        }
        // Read file content (includes boundary check)
        const content = await (0, fileManager_1.readFileSafe)(filePath, actualProjectRoot);
        // Handle CSS files separately (they don't use text translation)
        if (fileType === 'css') {
            await (0, translateCss_1.translateCss)(filePath, actualProjectRoot);
            console.log(`✓ Translated: ${path.basename(filePath)} → ${path.basename((0, fileManager_1.getOutputPath)(filePath))}`);
            return;
        }
        // Translate based on file type
        let translatedContent;
        switch (fileType) {
            case 'json':
                translatedContent = (0, translateJson_1.translateJson)(content, translationCache, dict);
                break;
            case 'html':
                translatedContent = (0, translateHtml_1.translateHtml)(content, translationCache, dict);
                break;
            case 'js':
                translatedContent = (0, translateStrings_1.translateStrings)(content, translationCache, dict);
                break;
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
        // Generate output path
        const outputPath = (0, fileManager_1.getOutputPath)(filePath);
        // Ensure output path is also within project root
        if (!(0, fileManager_1.isWithinProjectRoot)(outputPath, actualProjectRoot)) {
            throw new Error(`Output path is outside project root: ${outputPath}`);
        }
        // Write translated content
        await (0, fileManager_1.writeFileSafe)(outputPath, translatedContent);
        console.log(`✓ Translated: ${path.basename(filePath)} → ${path.basename(outputPath)}`);
    }
    catch (error) {
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
async function translateFiles(filePaths, projectRoot) {
    let successCount = 0;
    let failCount = 0;
    const actualProjectRoot = projectRoot || (0, detectRoot_1.getProjectRoot)();
    const toolRoot = (0, detectRoot_1.getToolRoot)();
    const tempFilePath = path.join(toolRoot, 'src', 'temp', 'missing_words.json');
    try {
        // Step 1: Load merged dictionary (dictionary + cached_words)
        let mergedDict = await (0, dictionaryLoader_1.loadMergedDictionary)();
        // Step 2: Pre-scan phase - collect missing words
        console.log('\nPre-scanning files for missing words...');
        const missingWords = await (0, missingWordsCollector_1.collectMissingWords)(filePaths, actualProjectRoot, mergedDict);
        // Step 3: AI translation if enabled and missing words exist
        if (ai_1.AI_ENABLED && missingWords.size > 0) {
            console.log(`Found ${missingWords.size} missing word(s). Attempting AI translation...`);
            try {
                // Save missing words to temp file
                await (0, missingWordsCollector_1.saveMissingWords)(missingWords, tempFilePath);
                // Call AI translator
                const aiTranslations = await (0, aiTranslator_1.translateMissingWords)();
                if (Object.keys(aiTranslations).length > 0) {
                    // Append AI translations to cached_words.json
                    await (0, dictionaryLoader_1.appendToCachedWords)(aiTranslations);
                    console.log(`✓ AI translated ${Object.keys(aiTranslations).length} word(s). Added to dictionary.`);
                    // Merge AI translations into main dictionary.json for permanent storage
                    await (0, dictionaryLoader_1.mergeToMainDictionary)(aiTranslations);
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
                    mergedDict = await (0, dictionaryLoader_1.loadMergedDictionary)();
                }
                else {
                    console.log('No AI translations received. Continuing with dictionary-only mode.');
                }
            }
            catch (error) {
                console.warn(`AI translation failed: ${error}. Continuing with dictionary-only mode.`);
            }
            finally {
                // Always delete temp file
                await (0, missingWordsCollector_1.deleteTempFile)(tempFilePath);
            }
        }
        else if (missingWords.size > 0) {
            console.log(`Found ${missingWords.size} missing word(s). AI translation is disabled.`);
        }
        else {
            console.log('All words found in dictionary. No AI translation needed.');
        }
        // Step 4: Continue with normal translation using updated dictionary
        // Separate CSS files from text translation files
        const textFiles = [];
        const cssFiles = [];
        for (const filePath of filePaths) {
            const fileType = detectFileType(filePath);
            if (fileType === 'css') {
                cssFiles.push(filePath);
            }
            else {
                textFiles.push(filePath);
            }
        }
        console.log(`\nTranslating ${filePaths.length} file(s)...\n`);
        // Process text translation files first (with merged dictionary)
        for (const filePath of textFiles) {
            try {
                await translateFileWithDict(filePath, actualProjectRoot, mergedDict);
                successCount++;
            }
            catch (error) {
                failCount++;
                // Continue with next file even if one fails
            }
        }
        // Process CSS files after text translations
        for (const filePath of cssFiles) {
            try {
                await translateFile(filePath, actualProjectRoot);
                successCount++;
            }
            catch (error) {
                failCount++;
                // Continue with next file even if one fails
            }
        }
        console.log(`\nTranslation complete: ${successCount} succeeded, ${failCount} failed`);
        console.log(`Cache size: ${translationCache.size} entries`);
    }
    catch (error) {
        // Ensure temp file is deleted even on error
        await (0, missingWordsCollector_1.deleteTempFile)(tempFilePath);
        throw error;
    }
}
/**
 * Legacy function for backward compatibility
 * Translates a single JSON file (old API)
 * @param inputFilename - Relative filename from project root
 */
function translate(inputFilename = 'input.json') {
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
