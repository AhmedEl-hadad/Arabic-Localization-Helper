/**
 * AI Translation Configuration
 * Uses environment variables for API key management
 */

import { hasApiKeys, getWorkingApiKey } from '../utils/keyRotation';

// Load environment variables (dotenv will be configured at entry point)
export const AI_ENABLED = true;

/**
 * Gets the current working API key
 * Supports both GEMINI_API_KEYS (comma-separated) and GEMINI_API_KEY (single, for backward compatibility)
 * @returns The current working API key, or undefined if no keys are available
 */
export const GEMINI_API_KEY: string | undefined = getWorkingApiKey();

/**
 * Validates that at least one Gemini API key is available
 * Supports both GEMINI_API_KEYS (comma-separated) and GEMINI_API_KEY (single, for backward compatibility)
 * @returns true if at least one key is present, false otherwise
 */
export function isApiKeyAvailable(): boolean {
  return hasApiKeys();
}

