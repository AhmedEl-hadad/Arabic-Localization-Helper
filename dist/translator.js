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
                translatedContent = (0, translateJson_1.translateJson)(content, translationCache);
                break;
            case 'html':
                translatedContent = (0, translateHtml_1.translateHtml)(content, translationCache);
                break;
            case 'js':
                translatedContent = (0, translateStrings_1.translateStrings)(content, translationCache);
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
    // Process text translation files first
    for (const filePath of textFiles) {
        try {
            await translateFile(filePath, projectRoot);
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
            await translateFile(filePath, projectRoot);
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
