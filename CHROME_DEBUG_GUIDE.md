# Chrome Browser Debugging Guide

## How to View Debug Logs, Requests, and Responses in Chrome

### Method 1: Using Chrome DevTools Network Tab

1. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or right-click on the page → "Inspect"

2. **Navigate to Network Tab**
   - Click on the "Network" tab in DevTools

3. **Filter Debug Logs**
   - In the filter box, type: `127.0.0.1:7242`
   - This will show all debug log requests

4. **Filter Gemini API Calls**
   - In the filter box, type: `generativelanguage.googleapis.com`
   - This will show all AI translation API requests

5. **View Request Details**
   - Click on any request to see:
     - **Headers**: Request headers and response headers
     - **Payload**: Request body (JSON data)
     - **Response**: Server response
     - **Preview**: Formatted response view
     - **Timing**: Request timing information

### Method 2: Using the Debug Dashboard

1. **Open the Dashboard**
   - Double-click `debug-dashboard.html` in your project folder
   - Or open it in Chrome: `File → Open → debug-dashboard.html`

2. **View Debug Information**
   - The dashboard shows:
     - Example debug log entries
     - API request/response structures
     - Console log messages
     - Request flow diagram

### Method 3: Console Tab for Logs

1. **Open Chrome DevTools**
   - Press `F12`

2. **Navigate to Console Tab**
   - Click on the "Console" tab
   - This shows all `console.log()`, `console.warn()`, and `console.error()` messages

3. **Filter Console Messages**
   - Use the filter box to search for specific messages
   - Filter by log level: `Info`, `Warnings`, `Errors`

---

## Example Debug Log Request

When you run the application, you'll see requests like this in the Network tab:

### Request Details
```
URL: http://127.0.0.1:7242/ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66
Method: POST
Status: (depends on if server is running)
```

### Request Headers
```
POST /ingest/e64cd474-5b87-4cea-aa55-09ab429f0d66 HTTP/1.1
Host: 127.0.0.1:7242
Content-Type: application/json
```

### Request Payload (Body)
```json
{
  "location": "index.ts:132",
  "message": "handleTranslate entry",
  "data": {
    "customProjectRoot": undefined
  },
  "timestamp": 1703123456789,
  "sessionId": "debug-session",
  "runId": "run1",
  "hypothesisId": "A"
}
```

---

## Example Gemini API Request

### Request Details
```
URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=YOUR_API_KEY
Method: POST
Status: 200 (if successful)
```

### Request Headers
```
POST /v1beta/models/gemini-1.5-pro-latest:generateContent?key=YOUR_API_KEY HTTP/1.1
Host: generativelanguage.googleapis.com
Content-Type: application/json
```

### Request Payload
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Translate these English words to Arabic. Return STRICT JSON ONLY with no explanations. Format: { \"word\": \"translated\" }.\n\nWords to translate:\n[\"Welcome\", \"Hello\", \"Goodbye\"]"
        }
      ]
    }
  ]
}
```

### Response
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\n  \"Welcome\": \"مرحبا\",\n  \"Hello\": \"مرحبا\",\n  \"Goodbye\": \"وداعا\"\n}"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "index": 0
    }
  ]
}
```

---

## Quick Reference: What to Look For

### Debug Logs (127.0.0.1:7242)
- ✅ Function entry/exit points
- ✅ File scanning results
- ✅ Word translation matches
- ✅ Error conditions
- ✅ Data flow tracking

### Gemini API (generativelanguage.googleapis.com)
- ✅ Model discovery requests
- ✅ Translation requests
- ✅ API responses with translations
- ✅ Error responses

### Console Messages
- ✅ Translation progress
- ✅ Success/failure messages
- ✅ Warnings about missing words
- ✅ Error messages

---

## Tips for Effective Debugging

1. **Preserve Log**: Check "Preserve log" in Network tab to keep logs after page navigation
2. **Export HAR**: Right-click in Network tab → "Save all as HAR" to export all requests
3. **Filter by Type**: Use filter dropdown to show only XHR/Fetch requests
4. **Search**: Use `Ctrl+F` in Network tab to search request/response content
5. **Throttling**: Use Network throttling to simulate slow connections

---

## Common Debug Scenarios

### Scenario 1: Debug Server Not Running
- **Symptom**: Requests to `127.0.0.1:7242` show as failed (red)
- **Solution**: The debug server needs to be running separately
- **Note**: The app continues to work even if debug server is offline (errors are silently caught)

### Scenario 2: API Key Missing
- **Symptom**: Gemini API requests return 401/403 errors
- **Solution**: Add `GEMINI_API_KEY` to `.env` file
- **Console**: You'll see warning: "Gemini API key missing"

### Scenario 3: No Debug Logs Appearing
- **Check**: Make sure you're running the application (`npm start`)
- **Check**: Filter is set correctly in Network tab
- **Check**: "Preserve log" is enabled

---

## Network Tab Filters

Use these filters in Chrome DevTools Network tab:

| Filter | Shows |
|--------|-------|
| `127.0.0.1:7242` | All debug log requests |
| `generativelanguage` | All Gemini API requests |
| `XHR` or `Fetch` | Only AJAX/fetch requests |
| `Failed` | Only failed requests |
| `domain:127.0.0.1` | All localhost requests |
| `domain:googleapis.com` | All Google API requests |

---

## Screenshot Locations

When debugging, look for these in Chrome DevTools:

1. **Network Tab → Request List**: Shows all HTTP requests
2. **Network Tab → Request Details → Headers**: Request/response headers
3. **Network Tab → Request Details → Payload**: Request body (JSON)
4. **Network Tab → Request Details → Response**: Server response
5. **Console Tab**: All console.log/warn/error messages

---

## Next Steps

1. Open `debug-dashboard.html` in Chrome to see visual examples
2. Run your application (`npm start translate`)
3. Open Chrome DevTools (F12)
4. Go to Network tab
5. Filter by `127.0.0.1:7242` or `generativelanguage`
6. Watch requests appear in real-time!

