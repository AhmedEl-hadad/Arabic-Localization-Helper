"use strict";
/**
 * Safe string replacement utilities that use word boundaries
 * to avoid breaking code patterns when translating strings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSafeToTranslate = isSafeToTranslate;
exports.replaceWithWordBoundary = replaceWithWordBoundary;
exports.isWhitespaceOnly = isWhitespaceOnly;
/**
 * Checks if a string should be translated based on safety rules.
 *
 * @param text - The text to check
 * @returns true if the text is safe to translate, false otherwise
 */
function isSafeToTranslate(text) {
    // Skip empty strings
    if (!text || text.trim().length === 0) {
        return false;
    }
    // Skip strings that look like URLs
    if (/^https?:\/\//i.test(text) || /^www\./i.test(text) || /^[a-z]+:\/\//i.test(text)) {
        return false;
    }
    // Skip strings that contain code patterns (common indicators)
    if (text.includes('${') || text.includes('${') || text.includes('function(') ||
        text.includes('=>') || text.includes('()') || text.includes('{}')) {
        return false;
    }
    // Skip strings that are purely numeric or special characters
    if (/^[\d\s\-_.,;:!?()]+$/.test(text)) {
        return false;
    }
    // Skip strings that look like identifiers (camelCase, snake_case, etc.)
    if (/^[a-z][a-zA-Z0-9_]*$/.test(text) || /^[A-Z][a-zA-Z0-9_]*$/.test(text)) {
        return false;
    }
    return true;
}
/**
 * Replaces text using word boundaries to avoid partial matches.
 * This ensures we don't break code by replacing parts of words.
 *
 * @param text - The text to search in
 * @param search - The text to find
 * @param replace - The replacement text
 * @returns The text with replacements made
 */
function replaceWithWordBoundary(text, search, replace) {
    // Escape special regex characters in search string
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use word boundary regex to match whole words only
    // \b matches word boundaries (between word and non-word characters)
    const regex = new RegExp(`\\b${escapedSearch}\\b`, 'gi');
    return text.replace(regex, replace);
}
/**
 * Checks if a string contains only whitespace
 * @param text - The text to check
 * @returns true if text is only whitespace
 */
function isWhitespaceOnly(text) {
    return /^\s*$/.test(text);
}
