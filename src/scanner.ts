import fg from 'fast-glob';
import * as path from 'path';
import { getProjectRoot, getToolRoot } from './utils/detectRoot';
import { shouldExcludeFile, isSupportedFile, isWithinProjectRoot } from './utils/fileManager';

/**
 * Scans the project directory for all files that need translation.
 * Uses fast-glob for performance and applies all exclusion rules.
 * 
 * @param customProjectRoot - Optional custom project root path. If not provided, defaults to parent directory of tool.
 * @returns Array of absolute paths to files that should be translated
 */
export async function scanFiles(customProjectRoot?: string): Promise<string[]> {
  const projectRoot = getProjectRoot(customProjectRoot);
  const toolRoot = getToolRoot();
  
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
    const files = await fg(patterns, {
      cwd: projectRoot,
      absolute: true,
      ignore: ignorePatterns,
      caseSensitiveMatch: false,
    });
    
    // Filter files through additional safety checks with strict boundary validation
    const validFiles = files.filter((filePath: string) => {
      // CRITICAL: Reject any file outside the project root
      const normalizedFilePath = path.resolve(filePath);
      const normalizedProjectRoot = path.resolve(projectRoot);
      
      if (!normalizedFilePath.startsWith(normalizedProjectRoot + path.sep) && 
          normalizedFilePath !== normalizedProjectRoot) {
        return false;
      }
      
      // Double-check file extension
      if (!isSupportedFile(filePath)) {
        return false;
      }
      
      // Double-check exclusions (includes boundary check)
      if (shouldExcludeFile(filePath, projectRoot)) {
        return false;
      }
      
      return true;
    });
    
    return validFiles;
  } catch (error) {
    throw new Error(`File scanning failed: ${error}`);
  }
}

/**
 * Scans files and returns a summary
 * @param customProjectRoot - Optional custom project root path. If not provided, defaults to parent directory of tool.
 * @returns Object with file count and list of files
 */
export async function scanFilesWithSummary(customProjectRoot?: string): Promise<{ count: number; files: string[] }> {
  const files = await scanFiles(customProjectRoot);
  return {
    count: files.length,
    files: files.sort()
  };
}

