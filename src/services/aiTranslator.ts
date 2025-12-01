import * as fs from 'fs/promises';
import * as path from 'path';
import { isApiKeyAvailable } from '../config/ai';
import { getToolRoot } from '../utils/detectRoot';
import { fetchWithRotation } from '../utils/keyRotation';

function getMissingWordsPath(): string {
  const toolRoot = getToolRoot();
  return path.join(toolRoot, 'src', 'temp', 'missing_words.json');
}

/**
 * Cleans the AI response to extract only JSON content
 * Removes any explanations, markdown code blocks, or extra text
 * Handles cases where JSON is embedded in text or has extra content
 * Also handles both object and array formats
 */
function extractJsonFromResponse(response: string): string {
  // Remove markdown code blocks if present
  let cleaned = response.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Try to find JSON - could be object {} or array []
  let jsonStart = -1;
  let isArray = false;
  
  // Check for array first (common format from AI)
  const arrayStart = cleaned.indexOf('[');
  const objectStart = cleaned.indexOf('{');
  
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    jsonStart = arrayStart;
    isArray = true;
  } else if (objectStart !== -1) {
    jsonStart = objectStart;
    isArray = false;
  } else {
    return '{}'; // No JSON found
  }
  
  // Find the matching closing bracket/brace by counting
  let bracketCount = 0;
  let jsonEnd = -1;
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';
  
  for (let i = jsonStart; i < cleaned.length; i++) {
    if (cleaned[i] === openChar) {
      bracketCount++;
    } else if (cleaned[i] === closeChar) {
      bracketCount--;
      if (bracketCount === 0) {
        jsonEnd = i;
        break;
      }
    }
  }
  
  if (jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  } else {
    // Fallback: use lastIndexOf if bracket matching fails
    jsonEnd = cleaned.lastIndexOf(closeChar);
    if (jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    } else {
      return '{}'; // Invalid JSON structure
    }
  }
  
  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Translates missing words using Gemini API
 * Returns a Record mapping English words to Arabic translations
 */
export async function translateMissingWords(): Promise<Record<string, string>> {
  // Check if API key is available
  if (!isApiKeyAvailable()) {
    console.warn('Gemini API key missing. Add GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY to .env');
    return {};
  }

  try {
    // Load missing words from temp file
    const missingWordsPath = getMissingWordsPath();
    const content = await fs.readFile(missingWordsPath, 'utf-8');
    const missingWordsObj = JSON.parse(content);
    const words = Object.keys(missingWordsObj);
    if (words.length === 0) {
      return {};
    }

    // Prepare prompt for Gemini
    const prompt = `Translate these English words to Arabic. Return STRICT JSON ONLY with no explanations. Format: { "word": "translated" }.

Words to translate:
${JSON.stringify(words, null, 2)}`;

    // First, try to get available models (optional - if this fails, we'll try common names)
    let availableModels: string[] = [];
    try {
      const listResponse = await fetchWithRotation(
        (key: string) => `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
      );
      if (listResponse.ok) {
        const listData = await listResponse.json() as any;
        if (listData.models) {
          availableModels = listData.models.map((m: any) => m.name?.replace('models/', '') || '').filter((n: string) => n);
        }
      }
    } catch (e) {
      // ListModels failed, will use fallback models
    }

    // Build list of models to try: use discovered models first, then fallback to common names
    const commonModels = [
      { version: 'v1beta', model: 'gemini-1.5-pro-latest' },
      { version: 'v1beta', model: 'gemini-1.5-flash-latest' },
      { version: 'v1beta', model: 'gemini-1.5-pro' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-pro' },
      { version: 'v1', model: 'gemini-1.5-pro' },
      { version: 'v1', model: 'gemini-1.5-flash' }
    ];
    
    // If we got models from ListModels, try those first (with v1beta)
    const modelAttempts = [
      ...availableModels.map(m => ({ version: 'v1beta' as const, model: m })),
      ...commonModels
    ];
    
    let response: Response | null = null;
    let apiVersion = '';
    let modelName = '';
    let lastError = '';
    
    for (const attempt of modelAttempts) {
      apiVersion = attempt.version;
      modelName = attempt.model;
      
      try {
        // Use fetchWithRotation to automatically handle key rotation
        response = await fetchWithRotation(
          (key: string) => `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }]
            })
          }
        );
        
        if (response.ok) {
          break; // Success! Exit the loop
        } else {
          // Response is not ok, but not a rotation-worthy error
          // Try next model
          const errorText = await response.text();
          lastError = errorText;
          response = null; // Continue to next attempt
        }
      } catch (error: any) {
        // All keys failed for this model, try next model
        lastError = error.message || error.toString();
        response = null; // Continue to next attempt
      }
    }
    
    if (!response || !response.ok) {
      console.warn(`Gemini API error: All model attempts failed. Last error: ${lastError.substring(0, 200)}`);
      return {};
    }

    const data = await response.json() as any;
    
    // Extract text from response
    let responseText = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      responseText = data.candidates[0].content.parts[0].text || '';
    }

    if (!responseText) {
      console.warn('Gemini API returned empty response');
      return {};
    }

    // Clean and parse JSON
    const cleanedJson = extractJsonFromResponse(responseText);
    try {
      let parsed = JSON.parse(cleanedJson);
      // Handle array format: [{"word": "English", "translated": "Arabic"}, ...] -> {"English": "Arabic", ...}
      // Or: [{"English": "Arabic"}, ...] -> {"English": "Arabic", ...}
      if (Array.isArray(parsed)) {
        const translations: Record<string, string> = {};
        for (const item of parsed) {
          if (typeof item === 'object' && item !== null) {
            // Check if it's the {"word": "English", "translated": "Arabic"} format
            if ('word' in item && 'translated' in item && typeof item.word === 'string' && typeof item.translated === 'string') {
              // Use "word" as key and "translated" as value
              translations[item.word] = item.translated;
            } else {
              // Handle {"English": "Arabic"} format (direct key-value pairs)
              for (const [key, value] of Object.entries(item)) {
                if (typeof value === 'string' && value.trim() !== '' && key !== 'word' && key !== 'translated') {
                  translations[key] = value;
                }
              }
            }
          }
        }
        parsed = translations;
      }
      
      // Validate it's an object with string values
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        console.warn('Gemini API returned invalid JSON format');
        return {};
      }
      
      const translations = parsed;

      // Filter to only keep valid string translations
      const validTranslations: Record<string, string> = {};
      for (const [key, value] of Object.entries(translations)) {
        if (typeof value === 'string' && value.trim() !== '') {
          validTranslations[key] = value;
        } else {
          }
      }
      return validTranslations;
    } catch (parseError: any) {
      console.warn(`Failed to parse Gemini response as JSON: ${parseError}`);
      return {};
    }

  } catch (error: any) {
    // Handle network errors, file read errors, etc.
    if (error.code === 'ENOENT') {
      // Temp file doesn't exist - no missing words
      return {};
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error calling Gemini API. Continuing with dictionary-only mode.');
    } else {
      console.warn(`AI translation error: ${error.message}. Continuing with dictionary-only mode.`);
    }
    
    return {};
  }
}

