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
exports.isWithinProjectRoot = isWithinProjectRoot;
exports.isSupportedFile = isSupportedFile;
exports.shouldExcludeFile = shouldExcludeFile;
exports.readFileSafe = readFileSafe;
exports.writeFileSafe = writeFileSafe;
exports.getOutputPath = getOutputPath;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const detectRoot_1 = require("./detectRoot");
/**
 * Supported file extensions for translation
 */
const SUPPORTED_EXTENSIONS = ['.json', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', '.css', '.scss', '.less'];
/**
 * Checks if a file path is within the project root directory.
 * Prevents path traversal and ensures files are within the specified project boundary.
 *
 * @param filePath - Absolute path to the file
 * @param projectRoot - Absolute path to the project root (optional, will be detected if not provided)
 * @returns true if the file is within the project root
 */
function isWithinProjectRoot(filePath, projectRoot) {
    const normalizedFilePath = path.resolve(filePath);
    const normalizedProjectRoot = path.resolve(projectRoot || (0, detectRoot_1.getProjectRoot)());
    // Get relative path from project root to file
    const relativePath = path.relative(normalizedProjectRoot, normalizedFilePath);
    // If relative path starts with '..', the file is outside the project root
    if (relativePath.startsWith('..')) {
        return false;
    }
    // Ensure the resolved file path starts with the project root
    // This is the primary check - file must be within project root directory
    return normalizedFilePath.startsWith(normalizedProjectRoot + path.sep) ||
        normalizedFilePath === normalizedProjectRoot;
}
/**
 * Checks if a file extension is supported for translation
 * @param filePath - Path to the file
 * @returns true if the file extension is supported
 */
function isSupportedFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}
/**
 * Checks if a file path should be excluded from processing
 * @param filePath - Absolute path to the file
 * @param projectRoot - Optional project root for boundary checking
 * @returns true if the file should be excluded
 */
function shouldExcludeFile(filePath, projectRoot) {
    const normalizedPath = path.normalize(filePath);
    // CRITICAL: Reject files outside the project root
    if (!isWithinProjectRoot(filePath, projectRoot)) {
        return true;
    }
    // Exclude tool root directory
    const toolRoot = (0, detectRoot_1.getToolRoot)();
    if (normalizedPath.startsWith(toolRoot)) {
        return true;
    }
    // Exclude node_modules
    if (normalizedPath.includes('node_modules')) {
        return true;
    }
    // Exclude .git directory
    if (normalizedPath.includes('.git')) {
        return true;
    }
    // Exclude build directories
    const buildDirs = ['dist', 'build', '.next', 'out'];
    for (const dir of buildDirs) {
        if (normalizedPath.includes(path.sep + dir + path.sep) ||
            normalizedPath.endsWith(path.sep + dir)) {
            return true;
        }
    }
    // Exclude files ending with -ar.* (already translated)
    const basename = path.basename(normalizedPath);
    if (/-ar\./.test(basename)) {
        return true;
    }
    return false;
}
/**
 * Safely reads a text file
 * @param filePath - Absolute path to the file
 * @param projectRoot - Optional project root for boundary checking
 * @returns File contents as string
 * @throws Error if file cannot be read
 */
async function readFileSafe(filePath, projectRoot) {
    try {
        // Validate file extension
        if (!isSupportedFile(filePath)) {
            throw new Error(`Unsupported file type: ${filePath}`);
        }
        // Check if file should be excluded (includes boundary check)
        if (shouldExcludeFile(filePath, projectRoot)) {
            throw new Error(`File is excluded from processing: ${filePath}`);
        }
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
    }
    catch (error) {
        throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
}
/**
 * Safely writes a text file
 * @param filePath - Absolute path to the file
 * @param content - Content to write
 * @throws Error if file cannot be written
 */
async function writeFileSafe(filePath, content) {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        // Write file
        await fs.writeFile(filePath, content, 'utf-8');
    }
    catch (error) {
        throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
}
/**
 * Generates the output file path for a translated file
 * Example: src/pages/home.json -> src/pages/home-ar.json
 * @param inputPath - Absolute path to the input file
 * @returns Absolute path to the output file
 */
function getOutputPath(inputPath) {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const name = path.basename(inputPath, ext);
    const outputName = `${name}-ar${ext}`;
    return path.join(dir, outputName);
}
