# Arabic Localization Helper

A command-line tool that automatically translates English text to Arabic in your project files. It scans your codebase, finds translatable content, and creates Arabic versions of your files without modifying the originals.

[![npm version](https://img.shields.io/npm/v/arabic-localization-helper)](https://www.npmjs.com/package/arabic-localization-helper)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## What is This Tool?

**Arabic Localization Helper** is a simple automation tool that helps you create Arabic translations of your web applications, React projects, and static websites. 

**What it does:**
- Scans your project files for English text
- Translates found text to Arabic using a built-in dictionary
- Creates new files with `-ar` suffix (e.g., `home.json` → `home-ar.json`)
- **Never modifies your original files**

**What it doesn't do:**
- Doesn't change your original code files
- Doesn't translate code logic or functionality
- Doesn't use AI or machine learning (uses a dictionary-based approach)
- Doesn't create backup files

> ⚠️ **Important**: When downloading the tool from GitHub, you get the source files. To use the tool properly, you must run `npm install` in the project directory to install all dependencies before running commands.

## Features

- ✅ **Multiple File Type Support**: JSON, JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, and LESS files
- ✅ **RTL CSS Support**: Automatically converts CSS/SCSS/LESS files to RTL versions
- ✅ **HTML RTL Attributes**: Automatically adds `dir="rtl"` and `lang="ar"` to HTML files
- ✅ **Safe AST Parsing**: Uses Abstract Syntax Tree parsing for JavaScript/TypeScript to only translate safe strings
- ✅ **Automatic Scanning**: Recursively scans your project directory
- ✅ **Smart Exclusions**: Automatically skips `node_modules`, `.git`, build folders, and already-translated files
- ✅ **Boundary Protection**: Never scans outside your specified project directory
- ✅ **Translation Caching**: Improves performance by caching translations
- ✅ **Clean Output**: Only creates translated files, no backup clutter
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

### From GitHub Source

1. **Clone or download the repository**:

```bash
git clone https://github.com/AhmedEl-hadad/Arabic-Localization-Helper.git
cd Arabic-Localization-Helper
```

2. **Install dependencies**:

```bash
npm install
```

3. **Build the project** (optional, for development):

```bash
npm run build
```

### Using npx (If Published to npm)

If the package is published to npm, you can use it directly:

```bash
npx arabic-localization-helper scan --project "/path/to/your/project"
```

## Quick Start

1. **Install dependencies** (if using from GitHub source):

```bash
npm install
```

2. **Preview what will be translated**:

```bash
npm start scan
```

Or specify a project path:

```bash
npm start scan --project "/path/to/your/project"
```

3. **Translate the files**:

```bash
npm start translate
```

Or specify a project path:

```bash
npm start translate --project "/path/to/your/project"
```

**Note:** By default, if no `--project` flag is specified, the tool scans the parent directory of the tool installation.

That's it! The tool will create Arabic versions of your files with the `-ar` suffix.

## Usage

### Commands

#### `scan` - Preview Files

Scans your project and lists all files that will be translated **without actually translating them**.

```bash
npm start scan
# or
npm start scan --project "/path/to/project"
# or (if published to npm)
npx arabic-localization-helper scan --project "/path/to/project"
```

**Output example:**
```
Scanning project for translatable files...

Found 15 file(s) to translate:

  1. src/components/Header.jsx
  2. src/pages/Home.jsx
  3. public/index.html
  4. src/data/config.json
  ... and 11 more file(s)

Total: 15 file(s)
```

#### `translate` - Translate Files

Actually translates all scanned files and creates Arabic versions.

```bash
npm start translate
# or
npm start translate --project "/path/to/project"
# or (if published to npm)
npx arabic-localization-helper translate --project "/path/to/project"
```

**Output example:**
```
Starting translation process...

Translating 15 file(s)...

✓ Translated: Header.jsx → Header-ar.jsx
✓ Translated: Home.jsx → Home-ar.jsx
✓ Translated: index.html → index-ar.html
✓ Translated: config.json → config-ar.json
...

Translation complete: 15 succeeded, 0 failed
Cache size: 342 entries

✓ All translations completed!
```

#### `test` - Test Mode

Creates sample files in a temporary directory and demonstrates the translation process.

```bash
npm start test
# or (if published to npm)
npx arabic-localization-helper test
```

This is useful for:
- Testing the tool without affecting your project
- Understanding how translations work
- Seeing example output

#### Default (No Command)

If you don't specify a command, it runs both `scan` and `translate`:

```bash
npm start
# or (if published to npm)
npx arabic-localization-helper
```

### Options

#### `--project <path>` or `--target <path>`

Specify a custom project directory to scan. Use this when:
- You want to translate a specific project
- You're running the tool from outside the project directory
- You want to translate multiple projects

**Examples:**

```bash
# Windows
npm start scan --project "C:\Users\YourName\Projects\MyApp"

# macOS/Linux
npm start scan --project "/home/username/projects/myapp"

# Relative path
npm start scan --project "./my-project"
```

**Note:** If no `--project` or `--target` flag is specified, the tool automatically scans the parent directory of the tool installation.

#### `--help` or `-h`

Display help information:

```bash
npm start --help
# or (if published to npm)
npx arabic-localization-helper --help
```

## Use Cases

### 1. Web Applications

Translate your React, Vue, or Angular application to Arabic:

```bash
npm start translate --project "./my-react-app"
```

**Result:** Creates Arabic versions of all component files and configuration files.

### 2. Static Websites

Translate HTML files for a static website:

```bash
npm start translate --project "./website"
```

**Result:** Creates `index-ar.html`, `about-ar.html`, etc.

### 3. JSON Configuration Files

Translate language files, configuration, or data files:

```bash
npm start translate --project "./config"
```

**Result:** Creates Arabic versions of all JSON files.

### 4. Multi-Language Support Preparation

Prepare your project for multi-language support by generating Arabic translations alongside your English content.

### 5. Content Management Systems

Translate content files for CMS-based websites.

## Supported File Types

### JSON Files (`.json`)

Translates all string values recursively throughout the JSON structure.

**Example:**

**Before (`config.json`):**
```json
{
  "app": {
    "title": "Welcome",
    "description": "This is a sample application",
    "buttons": {
      "submit": "Submit",
      "cancel": "Cancel"
    }
  }
}
```

**After (`config-ar.json`):**
```json
{
  "app": {
    "title": "مرحباً",
    "description": "هذا تطبيق تجريبي",
    "buttons": {
      "submit": "إرسال",
      "cancel": "إلغاء"
    }
  }
}
```

### HTML Files (`.html`, `.htm`)

Translates:
- Text content between HTML tags
- `alt` attributes on images
- `title` attributes
- `placeholder` attributes on inputs
- `aria-label` attributes for accessibility
- Automatically adds/updates `dir="rtl"` and `lang="ar"` to `<html>` tag

**Does NOT translate:**
- `class`, `id`, `href`, `src` attributes
- `style` attributes
- `data-*` attributes
- JavaScript event handlers

**Example:**

**Before (`index.html`):**
```html
<html>
<head>
    <title>Welcome Page</title>
</head>
<body>
    <h1>Welcome to our website</h1>
    <img src="logo.png" alt="Company Logo" title="Our Logo">
    <input type="text" placeholder="Enter your name" aria-label="Name input">
    <button>Submit</button>
</body>
</html>
```

**After (`index-ar.html`):**
```html
<html dir="rtl" lang="ar">
<head>
    <title>صفحة الترحيب</title>
</head>
<body>
    <h1>مرحباً بكم في موقعنا</h1>
    <img src="logo.png" alt="شعار الشركة" title="شعارنا">
    <input type="text" placeholder="أدخل اسمك" aria-label="إدخال الاسم">
    <button>إرسال</button>
</body>
</html>
```

**Note:** The tool automatically adds or updates `dir="rtl"` and `lang="ar"` attributes to the `<html>` tag in translated HTML files.

### JavaScript/TypeScript Files (`.js`, `.ts`, `.jsx`, `.tsx`)

Uses **AST (Abstract Syntax Tree) parsing** to safely translate only static string literals.

**Translates:**
- Static string literals: `"Hello World"`, `'Welcome'`
- JSX text content in React components

**Does NOT translate:**
- Template literals with variables: `` `Hello ${name}` ``
- Code identifiers: `functionName`, `variableName`
- URLs, file paths
- Code patterns that look like code

**Example:**

**Before (`App.jsx`):**
```jsx
function App() {
  const title = "Welcome";
  const message = "Hello World";
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{message}</p>
      <button onClick={handleClick}>Submit</button>
    </div>
  );
}
```

**After (`App-ar.jsx`):**
```jsx
function App() {
  const title = "مرحباً";
  const message = "مرحباً بالعالم";
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{message}</p>
      <button onClick={handleClick}>إرسال</button>
    </div>
  );
}
```

### CSS/SCSS/LESS Files (`.css`, `.scss`, `.less`)

Converts CSS files to RTL (Right-to-Left) versions using the `rtlcss` library. This handles directional properties like `margin`, `padding`, `left`, `right`, `float`, `text-align`, and more.

**What it does:**
- Converts LTR CSS to RTL CSS automatically
- Handles directional properties (`left` ↔ `right`, `margin-left` ↔ `margin-right`, etc.)
- Flips `float` values (`left` ↔ `right`)
- Adjusts `text-align` values
- Processes nested rules in SCSS/LESS files

**Example:**

**Before (`styles.css`):**
```css
.container {
  margin-left: 20px;
  padding-right: 10px;
  float: left;
  text-align: left;
}

.sidebar {
  position: absolute;
  left: 0;
  width: 250px;
}
```

**After (`styles-ar.css`):**
```css
.container {
  margin-right: 20px;
  padding-left: 10px;
  float: right;
  text-align: right;
}

.sidebar {
  position: absolute;
  right: 0;
  width: 250px;
}
```

**Note:** CSS files are processed for RTL conversion, not text translation. The tool creates `-ar.css`, `-ar.scss`, or `-ar.less` files with RTL-adjusted styles.

## How It Works

1. **Scanning**: The tool scans your project directory for supported file types (JSON, JS/TS/JSX/TSX, HTML, CSS/SCSS/LESS)

2. **Exclusion**: Automatically excludes:
   - `node_modules/` directory
   - `.git/` directory
   - Build folders (`dist/`, `build/`, `.next/`, `out/`)
   - Already translated files (`*-ar.*`)
   - The tool's own directory

3. **Parsing**: Each file is parsed based on its type:
   - **JSON**: Recursively processes all string values
   - **HTML**: Uses regex to find text content and specific attributes, adds/updates `dir="rtl"` and `lang="ar"` to `<html>` tag
   - **JavaScript/TypeScript**: Uses AST parsing to find safe string literals
   - **CSS/SCSS/LESS**: Processes through rtlcss library for RTL conversion

4. **Translation**: Matches English text against a built-in dictionary of 10,000+ common words and phrases

5. **Output**: Creates new files with `-ar` suffix containing the translations

6. **Original Files**: Your original files remain completely unchanged

## Output Files

### Naming Convention

The tool creates new files with the `-ar` suffix:

- `home.json` → `home-ar.json`
- `App.jsx` → `App-ar.jsx`
- `index.html` → `index-ar.html`
- `config.ts` → `config-ar.ts`
- `styles.css` → `styles-ar.css`
- `theme.scss` → `theme-ar.scss`
- `variables.less` → `variables-ar.less`

### File Structure

The translated files are created in the **same directory** as the original files, preserving your project structure:

```
my-project/
├── src/
│   ├── components/
│   │   ├── Header.jsx          (original)
│   │   └── Header-ar.jsx       (translated)
│   └── pages/
│       ├── Home.jsx            (original)
│       └── Home-ar.jsx         (translated)
└── public/
    ├── index.html              (original)
    └── index-ar.html           (translated)
```

### What Gets Created

- ✅ Only translated files with `-ar` suffix
- ✅ No backup files (`.original` files are NOT created)
- ✅ No modification to original files
- ✅ Preserves directory structure

## Safety Features

The tool includes multiple safety mechanisms to protect your code:

### 1. Never Modifies Originals

Your original files are **never touched**. All translations are written to new files.

### 2. Boundary Checking

The tool **never scans outside** your specified project directory. It includes strict path validation to prevent accidental scanning of parent directories or system folders.

### 3. Smart Exclusions

Automatically excludes:
- `node_modules/` - Dependencies
- `.git/` - Version control
- `dist/`, `build/`, `.next/`, `out/` - Build outputs
- `*-ar.*` - Already translated files
- Tool's own directory

### 4. AST-Based Parsing for JavaScript

For JavaScript/TypeScript files, the tool uses Abstract Syntax Tree (AST) parsing to:
- Only translate static string literals
- Skip template literals with variables
- Avoid translating code identifiers
- Preserve code structure and functionality

### 5. Safe String Detection

The tool checks if strings are safe to translate by:
- Skipping URLs (`https://...`, `www.`)
- Skipping code patterns (`${variable}`, `function()`, `=>`)
- Skipping identifiers (camelCase, snake_case)
- Skipping purely numeric or special character strings

## Limitations

### 1. Dictionary-Based Translation

- Only translates exact matches found in the dictionary
- Does not use AI, machine learning, or context-aware translation
- Limited to ~10,000 common English words and phrases
- Domain-specific terminology may not be translated

### 2. No Context Awareness

- Doesn't understand context or sentence structure
- Doesn't handle pluralization variations
- Doesn't handle gender-specific translations
- Word-by-word translation for phrases not in dictionary

### 3. Code Limitations

- **Does NOT translate code comments**
- **Does NOT translate template literals with variables**: `` `Hello ${name}` `` remains unchanged
- **Does NOT translate dynamic content** or strings built programmatically
- Only translates static string literals in JavaScript/TypeScript

### 4. Formatting

- **RTL CSS conversion is handled automatically** - CSS/SCSS/LESS files are converted to RTL versions
- **HTML `dir="rtl"` and `lang="ar"` attributes are added automatically** to translated HTML files
- Doesn't handle Arabic-specific typography beyond RTL conversion

### 5. HTML Attributes

- Only translates specific attributes: `alt`, `title`, `placeholder`, `aria-label`
- Does NOT translate: `class`, `id`, `href`, `src`, `style`, `data-*` attributes
- Does NOT translate JavaScript event handlers

### 6. Complex Strings

- May not translate complex sentences or paragraphs accurately
- Idiomatic expressions may not translate correctly
- Technical terms may need manual review

### 7. Performance

- Large projects (1000+ files) may take several minutes
- First run is slower due to dictionary loading
- Subsequent runs are faster due to caching

## Dictionary

The tool includes a built-in dictionary with **10,000+ English-Arabic translations** covering:

- Common words and phrases
- UI/UX terminology (buttons, labels, messages)
- Web development terms
- General vocabulary

The dictionary is stored in `src/dictionary.json` and is automatically loaded when the tool runs.

**Note:** The dictionary is not user-extensible in the current version. If you need specific translations, you may need to manually edit the generated Arabic files.

## Excluded Files and Directories

The tool automatically excludes the following from scanning:

### Directories
- `node_modules/` - npm packages
- `.git/` - Git repository
- `dist/`, `build/`, `.next/`, `out/` - Build outputs
- Tool's own installation directory

### Files
- Files already translated (`*-ar.*` pattern)
- Files outside the specified project root
- Unsupported file types

### Patterns
- Hidden files (starting with `.`)
- Binary files
- Files in excluded directories

## Examples

### Example 1: Translating a React App

```bash
# Preview what will be translated
npm start scan --project "./my-react-app"

# Translate all files
npm start translate --project "./my-react-app"
```

**Result:**
- All `.jsx` files get Arabic versions: `App.jsx` → `App-ar.jsx`
- All `.json` config files get Arabic versions
- All `.css` files get RTL versions: `styles.css` → `styles-ar.css`
- Original files remain unchanged

### Example 2: Translating Specific Directory

```bash
# Translate only the public folder
npm start translate --project "./public"
```

**Result:**
- Only files in the `public` directory are translated
- Other directories are ignored

### Example 3: Translating JSON Configuration

```bash
# Translate language files
npm start translate --project "./src/locales"
```

**Result:**
- All JSON files in the locales folder get Arabic versions
- Perfect for i18n (internationalization) setups

## Troubleshooting

### "No files found to translate"

**Possible causes:**
1. No supported file types in the directory
2. All files are in excluded directories (`node_modules`, `dist`, etc.)
3. Wrong project path specified

**Solutions:**
- Check that your project has `.json`, `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.scss`, or `.less` files
- Verify you're in the correct directory or using the correct `--project` path
- Make sure files aren't in excluded directories

### Files not being translated

**Possible causes:**
1. File type not supported
2. File is in an excluded directory
3. File is already translated (`*-ar.*`)

**Solutions:**
- Check file extension is supported (`.json`, `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.htm`, `.css`, `.scss`, `.less`)
- Move file out of `node_modules`, `dist`, or other excluded directories
- Remove `-ar` suffix if you want to re-translate

### Translation not appearing in output

**Possible causes:**
1. Text not in dictionary
2. Text is being skipped as unsafe (code pattern, URL, etc.)
3. Text is in a template literal with variables

**Solutions:**
- Check if the English text exists in the dictionary
- Verify the text isn't a URL, code pattern, or identifier
- For template literals, use static strings instead

### Path issues on Windows

**Problem:** Windows paths with backslashes may cause issues

**Solution:** Use quotes around paths:
```bash
npm start scan --project "C:\Users\YourName\Projects\MyApp"
```

Or use forward slashes (works on Windows too):
```bash
npm start scan --project "C:/Users/YourName/Projects/MyApp"
```

### "Command not found" or "npm start" not working

**Problem:** Dependencies not installed or wrong directory

**Solutions:**
- Make sure you've run `npm install` in the project directory
- Verify you're in the correct directory (where `package.json` is located)
- If using from GitHub source, ensure you've installed dependencies: `npm install`
- If published to npm, use `npx arabic-localization-helper` instead

## Best Practices

### 1. Always Preview First

Use the `scan` command before translating to see what will be affected:

```bash
npm start scan
```

### 2. Use Version Control

Keep your original files in version control (Git) so you can:
- Review changes
- Revert if needed
- Compare original and translated versions

### 3. Review Translated Files

After translation, review the Arabic files to:
- Check translation accuracy
- Verify formatting
- Ensure RTL support is added (if needed)

### 4. Test Your Application

Test your application with the Arabic files to ensure:
- No broken functionality
- Proper RTL layout (add CSS direction: rtl)
- Correct text display

### 5. Use Specific Directories

When possible, translate specific directories rather than entire projects:

```bash
# Better: Translate only what you need
npm start translate --project "./src/components"

# Instead of: Translating everything (scans parent directory by default)
npm start translate
```

### 6. Keep Originals

Never delete original files. The tool creates new files, so you can:
- Keep both English and Arabic versions
- Switch between languages
- Update translations independently

## Contributing

Contributions are welcome! If you'd like to contribute:

1. **Report Issues**: Found a bug? [Open an issue](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper/issues)
2. **Suggest Features**: Have an idea? [Create a feature request](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper/issues)
3. **Improve Dictionary**: Help expand the translation dictionary
4. **Documentation**: Improve this README or add examples

## License

ISC License - See LICENSE file for details

## Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper/issues)
- **Repository**: [View source code](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper)

## Author

Created by [Ahmed El-hadad](https://github.com/AhmedEl-hadad)

---

**Note:** This tool is designed to assist with translation but may require manual review and editing for production use. Always test translated files in your application before deploying.

