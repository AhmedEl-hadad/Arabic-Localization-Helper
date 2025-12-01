# Debug, Request, and Response Summary

This document provides a comprehensive overview of all debugging, API requests, and responses in the Arabic Localization Helper project.

## Table of Contents
1. [Debug Logging Endpoints](#debug-logging-endpoints)
2. [API Requests (Gemini)](#api-requests-gemini)
3. [Console Logging](#console-logging)
4. [Request/Response Structures](#requestresponse-structures)

---

## Debug Logging Endpoints

The codebase contains extensive debug logging via HTTP POST requests to a local debugging service.

### Debug Endpoint
```
POST http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66
Content-Type: application/json
```

### Debug Log Locations

#### 1. **index.ts** - Main Entry Point
- **Line 30**: `getCustomProjectRoot entry` - Logs function entry with CLI arguments
- **Line 43**: `checking positional arg` - Logs positional argument checking
- **Line 55**: `getCustomProjectRoot exit` - Logs function exit with result
- **Line 132**: `handleTranslate entry` - Logs translation handler entry
- **Line 143**: `project root resolved` - Logs resolved project root
- **Line 149**: `scanFiles result` - Logs file scan results
- **Line 164**: `handleTranslate error` - Logs translation errors

#### 2. **scanner.ts** - File Scanning
- **Line 15**: `scanFiles entry` - Logs scan entry with custom project root
- **Line 20**: `roots resolved` - Logs resolved project and tool roots
- **Line 50**: `before fast-glob call` - Logs before glob pattern matching
- **Line 59**: `fast-glob result` - Logs file count and first few files
- **Line 72**: `file rejected - outside root` - Logs files rejected for being outside project root
- **Line 80**: `file rejected - unsupported` - Logs unsupported file types
- **Line 88**: `file rejected - excluded` - Logs excluded files
- **Line 97**: `scanFiles exit` - Logs final scan results
- **Line 103**: `scanFiles error` - Logs scanning errors

#### 3. **translator.ts** - Translation Engine
- **Line 168**: `translateFiles entry` - Logs translation entry with file count
- **Line 184**: `missing words collected` - Logs count of missing words
- **Line 251**: `starting translation loop` - Logs start of translation process
- **Line 257**: `translating text file` - Logs each text file being translated
- **Line 264**: `text file translation error` - Logs text file translation errors
- **Line 274**: `translating css file` - Logs each CSS file being translated
- **Line 281**: `css file translation error` - Logs CSS file translation errors

#### 4. **translateHtml.ts** - HTML Translation
- **Line 88**: `word translated - exact match` - Logs exact word matches
- **Line 97**: `word translated - lowercase match` - Logs lowercase word matches
- **Line 108**: `word translated - clean match` - Logs clean word (no punctuation) matches
- **Line 118**: `word translated - clean lowercase match` - Logs clean lowercase matches
- **Line 125**: `word NOT translated - not in dict` - Logs words not found in dictionary

#### 5. **safeReplace.ts** - Safe Translation Checks
- **Line 20**: `word skipped - empty` - Logs empty strings skipped
- **Line 28**: `word skipped - URL` - Logs URL patterns skipped
- **Line 37**: `word skipped - code pattern` - Logs code patterns skipped
- **Line 45**: `word skipped - numeric/special` - Logs numeric/special character strings skipped
- **Line 54**: `word allowed - in dict` - Logs words allowed because in dictionary
- **Line 64**: `word allowed - in dict (lowercase)` - Logs lowercase words allowed
- **Line 76**: `word skipped - camelCase identifier` - Logs camelCase identifiers skipped
- **Line 86**: `word skipped - PascalCase with numbers/underscore` - Logs PascalCase with numbers/underscores skipped
- **Line 93**: `word allowed - PascalCase` - Logs PascalCase words allowed
- **Line 99**: `word allowed - default` - Logs words allowed by default

### Debug Request Structure
```json
{
  "location": "file.ts:line",
  "message": "descriptive message",
  "data": {
    // Context-specific data
  },
  "timestamp": 1234567890,
  "sessionId": "debug-session",
  "runId": "run1",
  "hypothesisId": "A|B|C|D|E|F"
}
```

---

## API Requests (Gemini)

### 1. List Available Models (Optional)
**Endpoint**: `GET https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}`

**Purpose**: Discovers available Gemini models before attempting translation

**Response Structure**:
```json
{
  "models": [
    {
      "name": "models/gemini-1.5-pro-latest",
      // ... other model properties
    }
  ]
}
```

**Location**: `src/services/aiTranslator.ts:105-115`

---

### 2. Generate Content (Translation Request)
**Endpoint**: `POST https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={GEMINI_API_KEY}`

**Versions Attempted**: `v1beta`, `v1`

**Models Attempted** (in order):
1. Discovered models from ListModels API
2. `gemini-1.5-pro-latest`
3. `gemini-1.5-flash-latest`
4. `gemini-1.5-pro`
5. `gemini-1.5-flash`
6. `gemini-pro`

**Request Structure**:
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Translate these English words to Arabic. Return STRICT JSON ONLY with no explanations. Format: { \"word\": \"translated\" }.\n\nWords to translate:\n[\"word1\", \"word2\", ...]"
        }
      ]
    }
  ]
}
```

**Headers**:
```
Content-Type: application/json
```

**Response Structure**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"word1\": \"translation1\", \"word2\": \"translation2\"}"
          }
        ]
      }
    }
  ]
}
```

**Location**: `src/services/aiTranslator.ts:139-165`

**Error Handling**:
- Tries multiple models until one succeeds
- If all fail, logs last error and returns empty object
- Network errors are caught and logged

---

## Console Logging

### Info Messages (`console.log`)

#### **index.ts**
- `"Starting translation process..."`
- `"No files found to translate."`
- `"✓ All translations completed!"`
- `"Arabic Localization Helper"`
- `"Scanning project for translatable files..."`
- `"Found {count} file(s) to translate:"`
- `"Running test mode..."`
- `"Created test sandbox: {path}"`
- `"Created sample files:"`
- `"TRANSLATED FILES OUTPUT:"`
- `"Test completed successfully!"`

#### **translator.ts**
- `"✓ Translated: {filename} → {outputFilename}"`
- `"Pre-scanning files for missing words..."`
- `"Found {count} missing word(s). Attempting AI translation..."`
- `"✓ AI translated {count} word(s). Added to dictionary."`
- `"No AI translations received. Continuing with dictionary-only mode."`
- `"Found {count} missing word(s). AI translation is disabled."`
- `"All words found in dictionary. No AI translation needed."`
- `"Translating {count} file(s)..."`
- `"Translation complete: {successCount} succeeded, {failCount} failed"`
- `"Cache size: {size} entries"`

#### **dictionaryLoader.ts**
- `"✓ Merged {count} translation(s) into dictionary.json"`

### Warning Messages (`console.warn`)

#### **aiTranslator.ts**
- `"Gemini API key missing. Add GEMINI_API_KEY to .env"`
- `"Gemini API error: All model attempts failed. Last error: {error}"`
- `"Gemini API returned empty response"`
- `"Gemini API returned invalid JSON format"`
- `"Failed to parse Gemini response as JSON: {error}"`
- `"Network error calling Gemini API. Continuing with dictionary-only mode."`
- `"AI translation error: {error}. Continuing with dictionary-only mode."`

#### **translator.ts**
- `"⚠ Warning: {count} word(s) were requested from AI but not returned:"`
- `"  - \"{word}\""`
- `"  ... and {count} more"`
- `"AI translation failed: {error}. Continuing with dictionary-only mode."`
- `"Warning: Using legacy translate() function. Consider using translateFile() instead."`

#### **dictionaryLoader.ts**
- `"Failed to save cached words: {error}"`
- `"Warning: Could not read dictionary.json, starting fresh: {error}"`
- `"Failed to merge translations into dictionary.json: {error}"`

#### **missingWordsCollector.ts**
- `"Warning: Could not read file for missing words collection: {filePath}"`

#### **translateStrings.ts**
- `"Failed to parse code, skipping translation: {error}"`

### Error Messages (`console.error`)

#### **index.ts**
- `"Translation failed: {error}"`
- `"Scan failed: {error}"`
- `"Test failed: {error}"`
- `"Unknown command: {command}"`
- `"Fatal error: {error}"`

#### **translator.ts**
- `"✗ Failed to translate {filePath}: {error}"`
- `"Error during translation: {error}"`

---

## Request/Response Structures

### Debug Log Request
```typescript
{
  location: string,        // "file.ts:line"
  message: string,         // Descriptive message
  data: object,           // Context-specific data
  timestamp: number,      // Date.now()
  sessionId: string,      // "debug-session"
  runId: string,          // "run1"
  hypothesisId: string    // "A" | "B" | "C" | "D" | "E" | "F"
}
```

### Gemini API Request
```typescript
{
  contents: [
    {
      parts: [
        {
          text: string  // Prompt with words to translate
        }
      ]
    }
  ]
}
```

### Gemini API Response
```typescript
{
  candidates: [
    {
      content: {
        parts: [
          {
            text: string  // JSON string with translations
          }
        ]
      }
    }
  ]
}
```

### AI Translation Response (Parsed)
```typescript
{
  [word: string]: string  // English word -> Arabic translation
}
```

**Supported Formats**:
1. Object: `{"word": "translation"}`
2. Array of objects: `[{"word": "English", "translated": "Arabic"}]`
3. Array of key-value objects: `[{"English": "Arabic"}]`

---

## Summary Statistics

- **Debug Log Points**: ~30+ locations across 5 files
- **API Endpoints**: 2 (ListModels, GenerateContent)
- **Console Log Types**: Info, Warning, Error
- **Debug Endpoint**: Single local endpoint for all debug logs
- **API Provider**: Google Gemini (multiple model fallbacks)

---

## Notes

1. All debug fetch calls use `.catch(()=>{})` to silently fail if the debug server is not running
2. Gemini API attempts multiple models in sequence until one succeeds
3. Console logging is used for user-facing messages
4. Debug logging is used for detailed internal state tracking
5. AI translation responses are cleaned to extract JSON from markdown code blocks

