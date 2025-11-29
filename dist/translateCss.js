"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateCss = translateCss;
const rtlcss_1 = __importDefault(require("rtlcss"));
const fileManager_1 = require("./utils/fileManager");
/**
 * Translates CSS/SCSS/LESS content to RTL using rtlcss.
 * Processes the raw content and generates RTL versions.
 *
 * @param filePath - Absolute path to the CSS/SCSS/LESS file
 * @param projectRoot - Optional project root for boundary checking
 * @returns Promise that resolves when RTL conversion is complete
 */
async function translateCss(filePath, projectRoot) {
    try {
        // Read file content (includes boundary check)
        const content = await (0, fileManager_1.readFileSafe)(filePath, projectRoot);
        // Process content through rtlcss
        const rtlContent = rtlcss_1.default.process(content);
        // Generate output path
        const outputPath = (0, fileManager_1.getOutputPath)(filePath);
        // Write RTL content to output file
        await (0, fileManager_1.writeFileSafe)(outputPath, rtlContent);
    }
    catch (error) {
        throw new Error(`Failed to translate CSS file ${filePath}: ${error}`);
    }
}
