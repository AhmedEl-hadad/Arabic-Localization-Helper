/**
 * API Key Rotation System
 * Handles automatic rotation through multiple Gemini API keys
 * on rate limit or invalid key errors
 */

// Parse API keys from environment variable
const parseApiKeys = (): string[] => {
  // Support both GEMINI_API_KEYS (comma-separated) and GEMINI_API_KEY (single, for backward compatibility)
  const keysEnv = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY;
  
  if (!keysEnv) {
    return [];
  }
  
  // Split by comma, trim whitespace, filter empty strings
  const keys = keysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
  return keys;
};

// Get all available keys
const apiKeys = parseApiKeys();

// Track current key index (starts at 0)
let currentKeyIndex = 0;

/**
 * Gets the currently active API key
 * @returns The current working API key, or undefined if no keys are available
 */
export function getWorkingApiKey(): string | undefined {
  if (apiKeys.length === 0) {
    return undefined;
  }
  
  // Ensure index is within bounds
  if (currentKeyIndex >= apiKeys.length) {
    currentKeyIndex = 0;
  }
  
  return apiKeys[currentKeyIndex];
}

/**
 * Rotates to the next API key
 * Loops back to the first key when reaching the end
 */
function rotateToNextKey(): void {
  if (apiKeys.length === 0) {
    return;
  }
  
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
}

/**
 * Checks if an error response indicates a rate limit
 */
function isRateLimitError(status: number): boolean {
  return status === 429;
}

/**
 * Checks if an error response indicates an invalid key
 * Also checks for 400 status with "API key not valid" message (Gemini API specific)
 */
function isInvalidKeyError(status: number, errorText?: string): boolean {
  // Standard invalid key status codes
  if (status === 401 || status === 403) {
    return true;
  }
  
  // Gemini API returns 400 for invalid keys with specific error message
  if (status === 400 && errorText) {
    const lowerError = errorText.toLowerCase();
    return lowerError.includes('api key not valid') || 
           lowerError.includes('invalid api key') ||
           lowerError.includes('please pass a valid api key');
  }
  
  return false;
}

/**
 * Checks if an error should trigger key rotation
 * @param status HTTP status code
 * @param errorText Optional error message text (needed for 400 status codes)
 */
function shouldRotateKey(status: number, errorText?: string): boolean {
  return isRateLimitError(status) || isInvalidKeyError(status, errorText);
}

/**
 * Gets a masked version of the key for logging (first 8 characters)
 */
function maskKey(key: string): string {
  if (key.length <= 8) {
    return key.substring(0, 4) + '****';
  }
  return key.substring(0, 8) + '...';
}

/**
 * Gets a human-readable reason for why a key was skipped
 */
function getSkipReason(status: number, errorText?: string): string {
  if (isRateLimitError(status)) {
    return 'Rate limit reached';
  }
  if (isInvalidKeyError(status, errorText)) {
    return 'Invalid API key';
  }
  if (errorText) {
    // Try to extract error message from response
    try {
      const errorObj = JSON.parse(errorText);
      if (errorObj.error?.message) {
        return errorObj.error.message;
      }
    } catch {
      // Not JSON, use raw text (truncated)
      return errorText.substring(0, 100);
    }
  }
  return 'Request failed';
}

/**
 * Wraps a fetch call with automatic key rotation
 * Tries all available keys before throwing an error
 * 
 * @param urlBuilder Function that builds the URL with a given key
 * @param fetchOptions Optional fetch options
 * @returns The Response object (guaranteed to be ok, or throws error)
 * @throws Error if all keys fail
 */
export async function fetchWithRotation(
  urlBuilder: (key: string) => string,
  fetchOptions?: RequestInit
): Promise<Response> {
  if (apiKeys.length === 0) {
    throw new Error('No API keys available. Please set GEMINI_API_KEYS in .env');
  }
  
  const startIndex = currentKeyIndex;
  let attempts = 0;
  const maxAttempts = apiKeys.length;
  let lastError: { status: number; errorText: string } | null = null;
  
  while (attempts < maxAttempts) {
    const key = apiKeys[currentKeyIndex];
    const keyIndex = currentKeyIndex;
    
    // Log which key is being used
    console.log(`[Key Rotation] Using key #${keyIndex + 1}/${apiKeys.length} (${maskKey(key)})`);
    
    try {
      // Build URL with current key
      const url = urlBuilder(key);
      
      // Make the fetch call
      const response = await fetch(url, fetchOptions);
      
      // Check if response is successful
      if (response.ok) {
        // Success! Log and return
        console.log(`[Key Rotation] Key #${keyIndex + 1} succeeded`);
        return response;
      }
      
      // Extract error text BEFORE checking shouldRotateKey (needed for 400 status codes)
      let errorText: string | undefined;
      try {
        errorText = await response.text();
      } catch {
        // Ignore text extraction errors
        errorText = undefined;
      }
      
      // Response is not ok - check if we should rotate
      if (shouldRotateKey(response.status, errorText)) {
        const reason = getSkipReason(response.status, errorText);
        console.warn(`[Key Rotation] Key #${keyIndex + 1} failed: ${reason} → trying next key`);
        
        // Store error info
        lastError = {
          status: response.status,
          errorText: errorText || `HTTP ${response.status}`
        };
        
        // Rotate to next key
        rotateToNextKey();
        attempts++;
        
        // Continue to next iteration
        continue;
      }
      
      // Not a rotation-worthy error, but still an error
      // Return the response as-is (caller will handle it)
      return response;
      
    } catch (error: any) {
      // Network error or other exception
      // For network errors, we might want to retry with next key
      // But for now, we'll throw immediately for non-HTTP errors
      
      // Check if it's a network error that might benefit from rotation
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error - try next key
        console.warn(`[Key Rotation] Key #${keyIndex + 1} failed: Network error → trying next key`);
        
        lastError = {
          status: 0,
          errorText: error.message || 'Network error'
        };
        
        rotateToNextKey();
        attempts++;
        continue;
      }
      
      // Other errors - throw immediately
      throw error;
    }
  }
  
  // All keys failed
  const errorMessage = lastError 
    ? `All ${apiKeys.length} API key(s) failed. Last error: HTTP ${lastError.status} - ${lastError.errorText}`
    : `All ${apiKeys.length} API key(s) failed.`;
  
  console.error(`[Key Rotation] ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Wraps an API call with automatic key rotation
 * Generic version for any async function that takes a key
 * 
 * @param apiCallFn Function that makes an API call with a given key
 * @returns The result of the API call
 * @throws Error if all keys fail
 */
export async function makeApiCallWithRotation<T>(
  apiCallFn: (key: string) => Promise<T>
): Promise<T> {
  if (apiKeys.length === 0) {
    throw new Error('No API keys available. Please set GEMINI_API_KEYS in .env');
  }
  
  let attempts = 0;
  const maxAttempts = apiKeys.length;
  let lastError: any = null;
  
  while (attempts < maxAttempts) {
    const key = apiKeys[currentKeyIndex];
    const keyIndex = currentKeyIndex;
    
    // Log which key is being used
    console.log(`[Key Rotation] Using key #${keyIndex + 1}/${apiKeys.length} (${maskKey(key)})`);
    
    try {
      // Make the API call with current key
      const result = await apiCallFn(key);
      
      // Success! Log and return
      console.log(`[Key Rotation] Key #${keyIndex + 1} succeeded`);
      return result;
      
    } catch (error: any) {
      // Check if error has status information
      let shouldRotate = false;
      let status: number | undefined;
      let errorText: string | undefined;
      
      if (error?.status) {
        status = error.status;
        errorText = error.message || error.toString();
        shouldRotate = status !== undefined && shouldRotateKey(status, errorText);
      } else if (error?.response?.status) {
        status = error.response.status;
        try {
          errorText = await error.response.text();
        } catch {
          errorText = error.message || error.toString();
        }
        shouldRotate = status !== undefined && shouldRotateKey(status, errorText);
      }
      
      // If we should rotate, move to next key
      if (shouldRotate) {
        const reason = getSkipReason(status || 0, errorText);
        console.warn(`[Key Rotation] Key #${keyIndex + 1} failed: ${reason} → trying next key`);
        
        // Rotate to next key
        rotateToNextKey();
        attempts++;
        
        // Store error for final throw if all keys fail
        lastError = error;
        
        // Continue to next iteration
        continue;
      }
      
      // If it's not a rotation-worthy error, throw immediately
      // (e.g., parsing errors, validation errors, etc.)
      throw error;
    }
  }
  
  // All keys failed
  const errorMessage = lastError 
    ? `All ${apiKeys.length} API key(s) failed. Last error: ${lastError.message || lastError.toString()}`
    : `All ${apiKeys.length} API key(s) failed.`;
  
  console.error(`[Key Rotation] ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Gets the number of available API keys
 */
export function getApiKeyCount(): number {
  return apiKeys.length;
}

/**
 * Checks if at least one API key is available
 */
export function hasApiKeys(): boolean {
  return apiKeys.length > 0;
}

