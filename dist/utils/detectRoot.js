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
exports.detectRoots = detectRoots;
exports.getProjectRoot = getProjectRoot;
exports.getToolRoot = getToolRoot;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Detects the tool root directory (where this tool is installed).
 * Works whether running from source, compiled, or installed as npm package.
 *
 * @returns Absolute path to tool root
 */
function detectToolRoot() {
    // __dirname will be:
    // - dist/utils when running from compiled output
    // - src/utils when running from source with ts-node
    // - node_modules/package-name/dist/utils when installed as package
    let currentDir = __dirname;
    let previousDir = '';
    // Try to find package.json or node_modules boundary
    while (currentDir !== previousDir) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            // If this is our package (check name), we found the tool root
            if (packageJson.name === 'arabic-localization-helper') {
                return path.resolve(currentDir);
            }
        }
        catch {
            // package.json doesn't exist or can't be read, continue searching
        }
        // Check if parent is node_modules - if so, currentDir is the package root
        const parentDir = path.dirname(currentDir);
        if (path.basename(parentDir) === 'node_modules') {
            // We're in node_modules/package-name, currentDir is the tool root
            return path.resolve(currentDir);
        }
        // Move up one level
        previousDir = currentDir;
        currentDir = parentDir;
    }
    // Fallback: assume we're in dist/utils or src/utils, go up 2 levels
    return path.resolve(__dirname, '..', '..');
}
/**
 * Detects the project root directory.
 * If customProjectRoot is provided, returns it immediately without any auto-detection.
 * Otherwise, defaults to parent directory of the tool.
 *
 * Also calculates the tool root directory (where this tool is installed)
 * to ensure we never scan or modify the tool's own files.
 *
 * @param customProjectRoot - Optional custom project root path. If provided, returned immediately without fallback.
 * @returns Object containing project root and tool root paths
 */
function detectRoots(customProjectRoot) {
    const toolRoot = detectToolRoot();
    // Project root: if custom path is provided, use it immediately and skip all auto-detection
    let projectRoot;
    if (customProjectRoot) {
        // Resolve custom path to absolute path - no fallback, no parent directory logic
        projectRoot = path.resolve(customProjectRoot);
    }
    else {
        // Only use auto-detection when no custom path is provided
        // Default: parent directory of tool (one level up)
        projectRoot = path.resolve(toolRoot, '..');
    }
    return {
        projectRoot: path.resolve(projectRoot),
        toolRoot: path.resolve(toolRoot)
    };
}
/**
 * Gets the project root directory.
 * By default, uses the parent directory of the tool.
 * Can be overridden with a custom project root path.
 *
 * @param customProjectRoot - Optional custom project root path. If not provided, defaults to parent directory of tool.
 * @returns Absolute path to project root
 */
function getProjectRoot(customProjectRoot) {
    return detectRoots(customProjectRoot).projectRoot;
}
/**
 * Gets the tool root directory (where this tool is installed)
 * @returns Absolute path to tool root
 */
function getToolRoot() {
    return detectRoots().toolRoot;
}
