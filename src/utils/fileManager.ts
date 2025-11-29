import * as fs from 'fs/promises';
import * as path from 'path';
import { getToolRoot, getProjectRoot } from './detectRoot';

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
export function isWithinProjectRoot(filePath: string, projectRoot?: string): boolean {
  const normalizedFilePath = path.resolve(filePath);
  const normalizedProjectRoot = path.resolve(projectRoot || getProjectRoot());
  
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
export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Checks if a file path should be excluded from processing
 * @param filePath - Absolute path to the file
 * @param projectRoot - Optional project root for boundary checking
 * @returns true if the file should be excluded
 */
export function shouldExcludeFile(filePath: string, projectRoot?: string): boolean {
  const normalizedPath = path.normalize(filePath);
  
  // CRITICAL: Reject files outside the project root
  if (!isWithinProjectRoot(filePath, projectRoot)) {
    return true;
  }
  
  // Exclude tool root directory
  const toolRoot = getToolRoot();
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
export async function readFileSafe(filePath: string, projectRoot?: string): Promise<string> {
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
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Safely writes a text file
 * @param filePath - Absolute path to the file
 * @param content - Content to write
 * @throws Error if file cannot be written
 */
export async function writeFileSafe(filePath: string, content: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Generates the output file path for a translated file
 * Example: src/pages/home.json -> src/pages/home-ar.json
 * @param inputPath - Absolute path to the input file
 * @returns Absolute path to the output file
 */
export function getOutputPath(inputPath: string): string {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const name = path.basename(inputPath, ext);
  const outputName = `${name}-ar${ext}`;
  return path.join(dir, outputName);
}

