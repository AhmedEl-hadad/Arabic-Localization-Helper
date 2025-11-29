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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanFiles = scanFiles;
exports.scanFilesWithSummary = scanFilesWithSummary;
const fast_glob_1 = __importDefault(require("fast-glob"));
const path = __importStar(require("path"));
const detectRoot_1 = require("./utils/detectRoot");
const fileManager_1 = require("./utils/fileManager");
/**
 * Scans the project directory for all files that need translation.
 * Uses fast-glob for performance and applies all exclusion rules.
 *
 * @param customProjectRoot - Optional custom project root path. If not provided, defaults to parent directory of tool.
 * @returns Array of absolute paths to files that should be translated
 */
async function scanFiles(customProjectRoot) {
    const projectRoot = (0, detectRoot_1.getProjectRoot)(customProjectRoot);
    const toolRoot = (0, detectRoot_1.getToolRoot)();
    // Whitelist of supported extensions
    const extensions = ['json', 'js', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'scss', 'less'];
    // Build glob patterns for all supported extensions
    const patterns = extensions.map(ext => `**/*.${ext}`);
    // Exclusion patterns
    const ignorePatterns = [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/out/**',
        '**/*-ar.*', // Already translated files
    ];
    // Add tool root to exclusions if it's within project root
    if (toolRoot.startsWith(projectRoot)) {
        const relativeToolPath = path.relative(projectRoot, toolRoot);
        if (relativeToolPath && relativeToolPath !== '.') {
            ignorePatterns.push(`${relativeToolPath}/**`);
        }
    }
    try {
        // Use fast-glob to find all matching files
        const files = await (0, fast_glob_1.default)(patterns, {
            cwd: projectRoot,
            absolute: true,
            ignore: ignorePatterns,
            caseSensitiveMatch: false,
        });
        // Filter files through additional safety checks with strict boundary validation
        const validFiles = files.filter((filePath) => {
            // CRITICAL: Reject any file outside the project root
            const normalizedFilePath = path.resolve(filePath);
            const normalizedProjectRoot = path.resolve(projectRoot);
            if (!normalizedFilePath.startsWith(normalizedProjectRoot + path.sep) &&
                normalizedFilePath !== normalizedProjectRoot) {
                return false;
            }
            // Double-check file extension
            if (!(0, fileManager_1.isSupportedFile)(filePath)) {
                return false;
            }
            // Double-check exclusions (includes boundary check)
            if ((0, fileManager_1.shouldExcludeFile)(filePath, projectRoot)) {
                return false;
            }
            return true;
        });
        return validFiles;
    }
    catch (error) {
        throw new Error(`File scanning failed: ${error}`);
    }
}
/**
 * Scans files and returns a summary
 * @param customProjectRoot - Optional custom project root path. If not provided, defaults to parent directory of tool.
 * @returns Object with file count and list of files
 */
async function scanFilesWithSummary(customProjectRoot) {
    const files = await scanFiles(customProjectRoot);
    return {
        count: files.length,
        files: files.sort()
    };
}
