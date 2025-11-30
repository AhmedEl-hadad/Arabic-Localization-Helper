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
      const cached = cache.get(obj)!;
      return cached;
    }
    
    // Try exact match first
    let translation = dict[obj];
    // Try lowercase version if exact match not found
    if (!translation) {
      const lowerObj = obj.toLowerCase();
      translation = dict[lowerObj];
      }
    
    if (translation) {
      // Store in cache
      if (cache) {
        cache.set(obj, translation);
      }
      return translation;
    }
    
    // Try word-by-word translation for multi-word strings
    const words = obj.split(/\s+/);
    const translatedWords = words.map((word: string) => {
      // Try exact word match first
      if (dict[word]) {
        return dict[word];
      }
      
      // Try lowercase version
      const lowerWord = word.toLowerCase();
      if (dict[lowerWord]) {
        return dict[lowerWord];
      }
      
      // Remove punctuation for dictionary lookup
      const cleanWord = word.replace(/[.,;:!?()\[\]{}'"]/g, '');
    
      // Try clean word match
      if (cleanWord && cleanWord !== word && dict[cleanWord]) {
        // Replace the clean word with translation, preserving punctuation
        return word.replace(cleanWord, dict[cleanWord]);
      }
      
      // Try clean word lowercase
      const cleanLowerWord = cleanWord.toLowerCase();
      if (cleanWord && cleanWord !== word && dict[cleanLowerWord]) {
        return word.replace(cleanWord, dict[cleanLowerWord]);
      }
      
      // Word not found, return original
      return word;
    });
    
    translation = translatedWords.join(' ');
    
    // Only cache if we actually translated something
    if (translation !== obj && cache) {
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
 * @param dict - The dictionary mapping English to Arabic (optional, will use default if not provided)
 * @returns Translated JSON content as string
 */
export function translateJson(
  content: string,
  cache?: Map<string, string>,
  dict?: Record<string, string>
): string {
  // Use provided dictionary or fallback to default (for backward compatibility)
  const translationDict = dict || (require('./dictionary.json') as Record<string, string>);
  
  // Parse JSON content
  const inputData = JSON.parse(content);
  
  // Translate the input data
  const translatedData = translateObject(inputData, translationDict, cache);
  
  // Return as formatted JSON string
  return JSON.stringify(translatedData, null, 2);
}

