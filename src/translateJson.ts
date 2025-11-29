import dictionary from './dictionary.json';

/**
 * Recursively translates English values in a JSON object to Arabic
 * using the dictionary. Preserves the structure of the JSON.
 * This is the same logic as the original translator, kept unchanged.
 * 
 * @param obj - The JSON object to translate (can be nested)
 * @param dict - The dictionary mapping English to Arabic
 * @param cache - Optional cache for translations (key: English, value: Arabic)
 * @returns A new object with translated values
 */
function translateObject(
  obj: any, 
  dict: Record<string, string>,
  cache?: Map<string, string>
): any {
  // If the value is a string, check if it exists in the dictionary
  if (typeof obj === 'string') {
    // Check cache first
    if (cache && cache.has(obj)) {
      return cache.get(obj)!;
    }
    
    // Return the Arabic translation if found, otherwise keep the original
    const translation = dict[obj] || obj;
    
    // Store in cache if translation was found
    if (cache && dict[obj]) {
      cache.set(obj, translation);
    }
    
    return translation;
  }
  
  // If the value is an array, translate each element
  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item, dict, cache));
  }
  
  // If the value is an object, recursively translate each property
  if (typeof obj === 'object' && obj !== null) {
    const translated: Record<string, any> = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Recursively translate nested objects/arrays/strings
        translated[key] = translateObject(obj[key], dict, cache);
      }
    }
    return translated;
  }
  
  // For other types (numbers, booleans, null), return as-is
  return obj;
}

/**
 * Translates a JSON file content to Arabic.
 * 
 * @param content - The JSON file content as string
 * @param cache - Optional cache for translations
 * @returns Translated JSON content as string
 */
export function translateJson(
  content: string,
  cache?: Map<string, string>
): string {
  const dict = dictionary as Record<string, string>;
  
  // Parse JSON content
  const inputData = JSON.parse(content);
  
  // Translate the input data
  const translatedData = translateObject(inputData, dict, cache);
  
  // Return as formatted JSON string
  return JSON.stringify(translatedData, null, 2);
}

