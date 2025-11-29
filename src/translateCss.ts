import rtlcss from 'rtlcss';
import { readFileSafe, writeFileSafe, getOutputPath } from './utils/fileManager';

/**
 * Translates CSS/SCSS/LESS content to RTL using rtlcss.
 * Processes the raw content and generates RTL versions.
 * 
 * @param filePath - Absolute path to the CSS/SCSS/LESS file
 * @param projectRoot - Optional project root for boundary checking
 * @returns Promise that resolves when RTL conversion is complete
 */
export async function translateCss(
  filePath: string,
  projectRoot?: string
): Promise<void> {
  try {
    // Read file content (includes boundary check)
    const content = await readFileSafe(filePath, projectRoot);
    
    // Process content through rtlcss
    const rtlContent = rtlcss.process(content);
    
    // Generate output path
    const outputPath = getOutputPath(filePath);
    
    // Write RTL content to output file
    await writeFileSafe(outputPath, rtlContent);
    
  } catch (error) {
    throw new Error(`Failed to translate CSS file ${filePath}: ${error}`);
  }
}

