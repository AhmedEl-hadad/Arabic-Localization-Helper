"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const arg_1 = __importDefault(require("arg"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const scanner_1 = require("./scanner");
const translator_1 = require("./translator");
const detectRoot_1 = require("./utils/detectRoot");
/**
 * CLI argument specification
 * Using permissive mode to allow flags after positional arguments
 */
const args = (0, arg_1.default)({
    '--project': String,
    '--target': String,
    '-h': '--help',
    '--help': Boolean,
}, {
    permissive: true, // Allow unknown arguments and continue parsing after positional args
});
/**
 * Gets the custom project root from CLI arguments
 * Handles case where npm consumes --project flag and path is passed as positional argument
 * @returns Custom project root path if provided, undefined otherwise
 */
function getCustomProjectRoot() {
    // First, try explicit flags
    let result = args['--project'] || args['--target'];
    // If no explicit flag, check if there's a positional argument that looks like a path
    // This handles the case where npm consumes --project and the path becomes positional
    if (!result && args._.length > 1) {
        // Skip the first positional (command like 'scan', 'translate', etc.)
        // Check remaining positionals for what looks like a path
        for (let i = 1; i < args._.length; i++) {
            const potentialPath = args._[i];
            // If it contains path separators or looks like an absolute path, treat it as project root
            if (potentialPath && (potentialPath.includes('\\') || potentialPath.includes('/') ||
                (potentialPath.length > 2 && potentialPath[1] === ':'))) {
                result = potentialPath;
                break;
            }
        }
    }
    return result;
}
/**
 * Displays help information
 */
function showHelp() {
    console.log(`
Arabic Localization Helper

Usage:
  npm start [command] [options]

Commands:
  scan              Scan and list all files that will be translated
  translate         Translate all scanned files
  test              Run test mode with sample files
  (no command)      Default: scan + translate

Options:
  --project <path>  Specify custom project path to scan (default: parent directory)
  --target <path>   Alias for --project
  --help, -h        Show this help message

Examples:
  npm start                    # Scan and translate (default: parent directory)
  npm start scan               # Only scan files (default: parent directory)
  npm start translate          # Only translate files (default: parent directory)
  npm start scan --project "C:\\Path\\To\\Project"    # Scan specific project
  npm start translate --project "C:\\Path\\To\\Project"  # Translate specific project
  npm start test               # Run test mode
`);
}
/**
 * Handles the scan command
 */
async function handleScan() {
    const customProjectRoot = getCustomProjectRoot();
    console.log('Scanning project for translatable files...\n');
    try {
        const result = await (0, scanner_1.scanFilesWithSummary)(customProjectRoot);
        console.log(`Found ${result.count} file(s) to translate:\n`);
        if (result.count === 0) {
            console.log('No files found. Make sure you are running this from your project root or specify a path with --project.');
            return;
        }
        // Show first 20 files, then indicate if there are more
        const filesToShow = result.files.slice(0, 20);
        filesToShow.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file}`);
        });
        if (result.count > 20) {
            console.log(`  ... and ${result.count - 20} more file(s)`);
        }
        console.log(`\nTotal: ${result.count} file(s)`);
    }
    catch (error) {
        console.error('Scan failed:', error);
        process.exit(1);
    }
}
/**
 * Handles the translate command
 */
async function handleTranslate() {
    const customProjectRoot = getCustomProjectRoot();
    console.log('Starting translation process...\n');
    try {
        // Clear cache for fresh start
        (0, translator_1.clearCache)();
        // Get project root for boundary checking
        const projectRoot = (0, detectRoot_1.getProjectRoot)(customProjectRoot);
        // Scan for files
        const files = await (0, scanner_1.scanFiles)(customProjectRoot);
        if (files.length === 0) {
            console.log('No files found to translate.');
            return;
        }
        // Translate all files (no backup creation)
        await (0, translator_1.translateFiles)(files, projectRoot);
        console.log('\n✓ All translations completed!');
    }
    catch (error) {
        console.error('Translation failed:', error);
        process.exit(1);
    }
}
/**
 * Handles the default command (scan + translate)
 */
async function handleDefault() {
    console.log('Arabic Localization Helper\n');
    // First scan
    await handleScan();
    console.log('\n' + '='.repeat(50) + '\n');
    // Then translate
    await handleTranslate();
}
/**
 * Handles the test command
 */
async function handleTest() {
    console.log('Running test mode...\n');
    // Create temporary sandbox directory
    const tempDir = path.join(os.tmpdir(), 'arabic-localization-test-' + Date.now());
    try {
        // Create temp directory
        await fs.mkdir(tempDir, { recursive: true });
        console.log(`Created test sandbox: ${tempDir}\n`);
        // Create sample HTML file
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This is a test page for translation.</p>
    <img src="image.jpg" alt="Test Image" title="Image Title">
    <input type="text" placeholder="Enter your name" aria-label="Name input">
    <button>Submit</button>
</body>
</html>`;
        // Create sample JSON file
        const jsonContent = JSON.stringify({
            title: "Welcome",
            message: "This is a test",
            items: ["First", "Second", "Third"],
            nested: {
                key: "value",
                description: "Nested object"
            }
        }, null, 2);
        // Create sample JS file
        const jsContent = `function greet() {
    const message = "Hello World";
    alert("Welcome to the application");
    console.log("This is a test message");
    return message;
}

const title = "Page Title";
const description = "This is a description";`;
        const htmlPath = path.join(tempDir, 'test.html');
        const jsonPath = path.join(tempDir, 'test.json');
        const jsPath = path.join(tempDir, 'test.js');
        await fs.writeFile(htmlPath, htmlContent, 'utf-8');
        await fs.writeFile(jsonPath, jsonContent, 'utf-8');
        await fs.writeFile(jsPath, jsContent, 'utf-8');
        console.log('Created sample files:');
        console.log(`  - ${htmlPath}`);
        console.log(`  - ${jsonPath}`);
        console.log(`  - ${jsPath}\n`);
        // Clear cache
        (0, translator_1.clearCache)();
        // Translate files (no backup creation)
        const files = [htmlPath, jsonPath, jsPath];
        await (0, translator_1.translateFiles)(files, tempDir);
        // Read and display translated files
        console.log('\n' + '='.repeat(50));
        console.log('TRANSLATED FILES OUTPUT:');
        console.log('='.repeat(50) + '\n');
        const htmlOutput = await fs.readFile(path.join(tempDir, 'test-ar.html'), 'utf-8');
        const jsonOutput = await fs.readFile(path.join(tempDir, 'test-ar.json'), 'utf-8');
        const jsOutput = await fs.readFile(path.join(tempDir, 'test-ar.js'), 'utf-8');
        console.log('--- test-ar.html ---');
        console.log(htmlOutput);
        console.log('\n--- test-ar.json ---');
        console.log(jsonOutput);
        console.log('\n--- test-ar.js ---');
        console.log(jsOutput);
        console.log('\n' + '='.repeat(50));
        console.log('Test completed successfully!');
        console.log(`Test files are in: ${tempDir}`);
        console.log('You can manually inspect them or they will be cleaned up automatically.\n');
    }
    catch (error) {
        console.error('Test failed:', error);
        // Try to clean up on error
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
        catch {
            // Ignore cleanup errors
        }
        process.exit(1);
    }
}
/**
 * Main entry point
 */
async function main() {
    try {
        // Show help if requested
        if (args['--help']) {
            showHelp();
            return;
        }
        // Get command from arguments (first non-flag argument)
        // If first arg looks like a path (not a command), treat it as project root and use default command
        let command = args._[0];
        if (command && (command.includes('\\') || command.includes('/') || (command.length > 2 && command[1] === ':'))) {
            // First positional is a path, not a command - use default behavior
            command = undefined;
        }
        switch (command) {
            case 'scan':
                await handleScan();
                break;
            case 'translate':
                await handleTranslate();
                break;
            case 'test':
                await handleTest();
                break;
            case undefined:
                // No command = default (scan + translate)
                await handleDefault();
                break;
            default:
                console.error(`Unknown command: ${command}`);
                console.log('Use --help to see available commands.');
                process.exit(1);
        }
    }
    catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}
// Execute main function
main();
