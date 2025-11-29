import * as path from 'path';
import * as fs from 'fs';

/**
 * Detects the tool root directory (where this tool is installed).
 * Works whether running from source, compiled, or installed as npm package.
 * 
 * @returns Absolute path to tool root
 */
function detectToolRoot(): string {
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
    } catch {
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
export function detectRoots(customProjectRoot?: string): { projectRoot: string; toolRoot: string } {
  const toolRoot = detectToolRoot();
  
  // Project root: if custom path is provided, use it immediately and skip all auto-detection
  let projectRoot: string;
  if (customProjectRoot) {
    // Resolve custom path to absolute path - no fallback, no parent directory logic
    projectRoot = path.resolve(customProjectRoot);
  } else {
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
export function getProjectRoot(customProjectRoot?: string): string {
  return detectRoots(customProjectRoot).projectRoot;
}

/**
 * Gets the tool root directory (where this tool is installed)
 * @returns Absolute path to tool root
 */
export function getToolRoot(): string {
  return detectRoots().toolRoot;
}

