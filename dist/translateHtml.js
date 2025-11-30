"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateHtml = translateHtml;
const safeReplace_1 = require("./utils/safeReplace");
/**
 * Translates HTML content to Arabic.
 * Only translates:
 * - Inner text between tags
 * - alt, title, placeholder, aria-label attributes
 *
 * Does NOT translate:
 * - class, id, href, src, style, data-*, JS event handlers
 *
 * @param content - The HTML content as string
 * @param cache - Optional cache for translations
 * @param dict - The dictionary mapping English to Arabic (optional, will use default if not provided)
 * @returns Translated HTML content as string
 */
function translateHtml(content, cache, dict) {
    // Use provided dictionary or fallback to default (for backward compatibility)
    const translationDict = dict || require('./dictionary.json');
    let result = content;
    // Add or update dir="rtl" and lang="ar" to <html> tag
    result = result.replace(/<html\s*([^>]*)>/i, (match, attributes) => {
        let updatedAttributes = attributes || '';
        // Update or add dir attribute
        if (/dir\s*=\s*["'][^"']*["']/i.test(updatedAttributes)) {
            updatedAttributes = updatedAttributes.replace(/dir\s*=\s*["'][^"']*["']/i, 'dir="rtl"');
        }
        else {
            updatedAttributes = updatedAttributes.trim() + (updatedAttributes.trim() ? ' ' : '') + 'dir="rtl"';
        }
        // Update or add lang attribute
        if (/lang\s*=\s*["'][^"']*["']/i.test(updatedAttributes)) {
            updatedAttributes = updatedAttributes.replace(/lang\s*=\s*["'][^"']*["']/i, 'lang="ar"');
        }
        else {
            updatedAttributes = updatedAttributes.trim() + (updatedAttributes.trim() ? ' ' : '') + 'lang="ar"';
        }
        return `<html ${updatedAttributes.trim()}>`;
    });
    /**
     * Translates a single text string using dictionary and cache
     */
    function translateText(text) {
        if (!text || (0, safeReplace_1.isWhitespaceOnly)(text)) {
            return text;
        }
        // Check cache first
        if (cache && cache.has(text)) {
            return cache.get(text);
        }
        // Check if safe to translate
        if (!(0, safeReplace_1.isSafeToTranslate)(text)) {
            return text;
        }
        // Look up in dictionary
        let translated = text;
        if (translationDict[text]) {
            translated = translationDict[text];
            // Store in cache
            if (cache) {
                cache.set(text, translated);
            }
        }
        else {
            // Try word-by-word translation for multi-word strings
            const words = text.split(/\s+/);
            const translatedWords = words.map((word) => {
                const cleanWord = word.replace(/[.,;:!?()]/g, '');
                if (translationDict[cleanWord]) {
                    return word.replace(cleanWord, translationDict[cleanWord]);
                }
                return word;
            });
            translated = translatedWords.join(' ');
        }
        return translated;
    }
    // Translate text content between tags
    // Match text nodes (not inside tags or script/style tags)
    result = result.replace(/>([^<]+)</g, (match, textContent) => {
        // Skip if this looks like it's inside a script or style tag
        const beforeMatch = result.substring(0, result.indexOf(match));
        const lastScript = beforeMatch.lastIndexOf('<script');
        const lastStyle = beforeMatch.lastIndexOf('<style');
        const lastScriptClose = beforeMatch.lastIndexOf('</script>');
        const lastStyleClose = beforeMatch.lastIndexOf('</style>');
        if ((lastScript > lastScriptClose) || (lastStyle > lastStyleClose)) {
            return match; // Inside script or style tag, skip
        }
        // Preserve whitespace around text
        const trimmed = textContent.trim();
        const leadingWhitespace = textContent.match(/^\s*/)?.[0] || '';
        const trailingWhitespace = textContent.match(/\s*$/)?.[0] || '';
        const translated = translateText(trimmed);
        return `>${leadingWhitespace}${translated}${trailingWhitespace}<`;
    });
    // Translate alt attributes
    result = result.replace(/alt\s*=\s*["']([^"']*)["']/gi, (match, altText) => {
        const translated = translateText(altText);
        return `alt="${translated}"`;
    });
    // Translate title attributes
    result = result.replace(/title\s*=\s*["']([^"']*)["']/gi, (match, titleText) => {
        const translated = translateText(titleText);
        return `title="${translated}"`;
    });
    // Translate placeholder attributes
    result = result.replace(/placeholder\s*=\s*["']([^"']*)["']/gi, (match, placeholderText) => {
        const translated = translateText(placeholderText);
        return `placeholder="${translated}"`;
    });
    // Translate aria-label attributes
    result = result.replace(/aria-label\s*=\s*["']([^"']*)["']/gi, (match, ariaLabelText) => {
        const translated = translateText(ariaLabelText);
        return `aria-label="${translated}"`;
    });
    return result;
}
