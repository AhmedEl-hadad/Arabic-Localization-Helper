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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:13',message:'scanFiles entry',data:{customProjectRoot},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const projectRoot = getProjectRoot(customProjectRoot);
  const toolRoot = getToolRoot();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:15',message:'roots resolved',data:{projectRoot,toolRoot},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Whitelist of supported extensions
  const extensions = ['json', 'js', 'ts', 'jsx', 'tsx', 'html', 'htm', 'css', 'scss', 'less'];
  
  // Build absolute glob patterns to avoid issues with spaces in cwd path
  // Use path.join to properly handle path separators and spaces
  const normalizedProjectRoot = path.normalize(projectRoot);
  const patterns = extensions.map(ext => path.join(normalizedProjectRoot, '**', `*.${ext}`).replace(/\\/g, '/'));
  
  // Build absolute exclusion patterns
  const ignorePatterns: string[] = [
    path.join(normalizedProjectRoot, '**', 'node_modules', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', '.git', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', 'dist', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', 'build', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', '.next', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', 'out', '**').replace(/\\/g, '/'),
    path.join(normalizedProjectRoot, '**', '*-ar.*').replace(/\\/g, '/'), // Already translated files
  ];
  
  // Add tool root to exclusions if it's within project root
  if (toolRoot.startsWith(projectRoot)) {
    const normalizedToolRoot = path.normalize(toolRoot);
    ignorePatterns.push(path.join(normalizedToolRoot, '**').replace(/\\/g, '/'));
  }
  
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:43',message:'before fast-glob call',data:{patterns,projectRoot,ignorePatterns},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Use fast-glob with absolute patterns (no cwd needed, avoids space issues)
    const files = await fg(patterns, {
      absolute: true,
      ignore: ignorePatterns,
      caseSensitiveMatch: false,
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:49',message:'fast-glob result',data:{fileCount:files.length,firstFewFiles:files.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Filter files through additional safety checks with strict boundary validation
    let filteredCount = 0;
    const validFiles = files.filter((filePath: string) => {
      // CRITICAL: Reject any file outside the project root
      const normalizedFilePath = path.resolve(filePath);
      const normalizedProjectRoot = path.resolve(projectRoot);
      
      if (!normalizedFilePath.startsWith(normalizedProjectRoot + path.sep) && 
          normalizedFilePath !== normalizedProjectRoot) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:58',message:'file rejected - outside root',data:{filePath,normalizedFilePath,normalizedProjectRoot},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        return false;
      }
      
      // Double-check file extension
      if (!isSupportedFile(filePath)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:63',message:'file rejected - unsupported',data:{filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return false;
      }
      
      // Double-check exclusions (includes boundary check)
      if (shouldExcludeFile(filePath, projectRoot)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:68',message:'file rejected - excluded',data:{filePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return false;
      }
      
      filteredCount++;
      return true;
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:75',message:'scanFiles exit',data:{totalFiles:files.length,validFilesCount:validFiles.length,filteredCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    return validFiles;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'scanner.ts:77',message:'scanFiles error',data:{errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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

