/**
 * AI Translation Configuration
 * Uses environment variables for API key management
 */

// Load environment variables (dotenv will be configured at entry point)
export const AI_ENABLED = true;

export const GEMINI_API_KEY: string | undefined = process.env.GEMINI_API_KEY;

/**
 * Validates that the Gemini API key is available
 * @returns true if key is present, false otherwise
 */
export function isApiKeyAvailable(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '';
}

