export function toCamelCase(word : string) {
    return word
        .replace(/[/-\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^./, (char) => char.toLowerCase());
}