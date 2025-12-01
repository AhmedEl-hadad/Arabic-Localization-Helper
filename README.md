# Arabic Localization Helper

A command-line tool that automatically translates English text to Arabic in your project files. It scans your codebase, finds translatable content, and creates Arabic versions of your files without modifying the originals.

[![npm version](https://img.shields.io/npm/v/arabic-localization-helper)](https://www.npmjs.com/package/arabic-localization-helper)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## What is This Tool?

**Arabic Localization Helper** is a powerful automation tool that helps you create Arabic translations of your web applications, React projects, and static websites. With optional AI-powered translation, it intelligently expands its dictionary while maintaining a dictionary-first approach.

**Key Features:**
- Scans and translates JSON, JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, and LESS files
- Creates new files with `-ar` suffix (e.g., `home.json` → `home-ar.json`)
- **Never modifies your original files**
- Optional Gemini AI integration for missing words
- Automatic RTL CSS conversion and HTML RTL attributes
- Safe AST parsing for JavaScript/TypeScript
- Smart exclusions (node_modules, .git, build folders)
- Cross-platform support (Windows, macOS, Linux)

> ⚠️ **Important**: Run `npm install` in the project directory before using the tool.

## Installation

### From GitHub Source

```bash
git clone https://github.com/AhmedEl-hadad/Arabic-Localization-Helper.git
cd Arabic-Localization-Helper
npm install
```

### Using npx (If Published to npm)

```bash
npx arabic-localization-helper scan --project "/path/to/your/project"
```

## Quick Start

1. **Preview what will be translated:**
   ```bash
   npm start scan --project "/path/to/your/project"
   ```

2. **Translate the files:**
   ```bash
   npm start translate --project "/path/to/your/project"
   ```

## Deploying the Latest Release

To run the most up-to-date build (v1.0.0 at the time of writing) locally or before publishing:

1. `git pull` to ensure you have the latest tag/commit.
2. `npm install` to sync dependencies.
3. `npm run build` to refresh the `dist/` output shipped in the package.
4. `npm start scan --project "<your project>"` to verify the scan results.
5. `npm start translate --project "<your project>"` to generate `-ar` files.
6. (Optional) `npm pack` or `npm publish` when you're ready to share the final build.

You can also consume the latest public release directly with `npx arabic-localization-helper@latest scan --project "<your project>"`.

**Note:** If no `--project` flag is specified, the tool scans the parent directory of the tool installation.

## Commands

- `scan` - Preview files that will be translated (no actual translation)
- `translate` - Translate all scanned files and create Arabic versions
- `test` - Run test mode with sample files
- (no command) - Default: runs both scan and translate

## Supported File Types

### JSON Files
Translates all string values recursively throughout the JSON structure.

### HTML Files
Translates text content, `alt`, `title`, `placeholder`, and `aria-label` attributes. Automatically adds `dir="rtl"` and `lang="ar"` to `<html>` tag.

### JavaScript/TypeScript Files
Uses AST parsing to safely translate only static string literals. Does NOT translate template literals with variables or code identifiers.

### CSS/SCSS/LESS Files
Converts CSS files to RTL (Right-to-Left) versions using the `rtlcss` library. Handles directional properties like `margin`, `padding`, `left`, `right`, `float`, `text-align`, etc.

## Hybrid AI Translation (Optional)

The tool includes optional **Hybrid AI Translation** using Google's Gemini API for words not found in the dictionary.

### How It Works

1. **Dictionary-First**: Always checks `dictionary.json` first, then `cached_words.json`
2. **Pre-Scanning**: Pre-scans all files to collect missing words
3. **AI Translation**: Single API request to Gemini for all missing words
4. **Smart Model Detection**: Automatically tries multiple Gemini API models
5. **Dual Dictionary Expansion**: Saves translations to both `cached_words.json` and `dictionary.json`
6. **Graceful Fallback**: Continues with dictionary-only mode if AI fails

### Setup

1. Create `.env` file in the project root:
   ```bash
   GEMINI_API_KEY="your-api-key-here"
   ```

   > Demo/testing-only key for the hosted preview (won't work in production):
   > `GEMINI_API_KEY="AIzaSyCxbSbEWDIKWIFyox24BRYq_-mA93bWwJI"`

2. Get a Gemini API Key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. The feature works automatically once configured. No code changes needed.

### Features

- ✅ Dictionary-first approach
- ✅ One request per run (all missing words at once)
- ✅ Automatic dictionary expansion
- ✅ Works offline if AI is unavailable
- ✅ Robust error handling

## Output Files

The tool creates new files with the `-ar` suffix in the same directory as originals:
- `home.json` → `home-ar.json`
- `App.jsx` → `App-ar.jsx`
- `index.html` → `index-ar.html`
- `styles.css` → `styles-ar.css`

**Original files are never modified.**

## Safety Features

- ✅ Never modifies original files
- ✅ Boundary protection (never scans outside project directory)
- ✅ Smart exclusions (node_modules, .git, build folders, already-translated files)
- ✅ AST-based parsing for safe JavaScript/TypeScript translation
- ✅ Safe string detection (skips URLs, code patterns, identifiers)

## Dictionary

Built-in dictionary with **10,000+ English-Arabic translations**. The dictionary automatically expands through AI translation (if enabled), saving new words to both `cached_words.json` and `dictionary.json`.

## Limitations

- Primarily translates exact dictionary matches (with optional AI enhancement)
- No context awareness (word-by-word translation for phrases not in dictionary)
- Does NOT translate code comments, template literals with variables, or dynamic content
- Large projects (1000+ files) may take several minutes

## Troubleshooting

**"No files found to translate"**
- Check for supported file types (`.json`, `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.scss`, `.less`)
- Verify project path is correct
- Ensure files aren't in excluded directories

**Files not being translated**
- Check file extension is supported
- Move file out of `node_modules`, `dist`, or other excluded directories
- Remove `-ar` suffix if you want to re-translate

**Translation not appearing**
- Text may not be in dictionary (enable AI translation if needed)
- Text may be skipped as unsafe (URL, code pattern, etc.)
- Template literals with variables are not translated

## Best Practices

1. **Always preview first**: Use `scan` command before translating
2. **Use version control**: Keep original files in Git
3. **Review translated files**: Check translation accuracy
4. **Test your application**: Ensure proper RTL layout and functionality
5. **Use specific directories**: Translate only what you need

## Contributing

Contributions are welcome! Report issues, suggest features, improve the dictionary, or enhance documentation.

- **GitHub Issues**: [Report bugs or request features](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper/issues)
- **Repository**: [View source code](https://github.com/AhmedEl-hadad/Arabic-Localization-Helper)

## License

ISC License - See LICENSE file for details

## Author

Created by [Ahmed El-hadad](https://github.com/AhmedEl-hadad)

---

**Note:** This tool is designed to assist with translation but may require manual review and editing for production use. Always test translated files in your application before deploying.
