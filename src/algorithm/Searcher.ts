/**
 * @license MIT
 * Adapted from [[https://github.com/aceakash/string-similarity]], with optimizations:
 * 1. Cache the string length
 * 2. No need to use .has for map
 * 3. Pre-process the target list of strings for repeated searches (see [[FastSearcher]])
 * About 40% faster than the original one.
 * @param first
 * @param second
 */
function compareTwoStrings(first: string, second: string) {
    const len1 = first.length,
        len2 = second.length;
    if (!len1 && !len2) return 1; // if both are empty strings
    if (!len1 || !len2) return 0; // if only one is empty string
    if (first === second) return 1; // identical
    if (len1 === 1 && len2 === 1) return 0; // both are 1-letter strings
    if (len1 < 2 || len2 < 2) return 0; // if either is a 1-letter string

    const firstBigrams = new Map<string, number>();
    for (let i = 0; i < len1 - 1; i++) {
        const bigram = first.substring(i, i + 2);
        firstBigrams.set(bigram, 1 + (firstBigrams.get(bigram) || 0));
    }

    let intersectionSize = 0;
    for (let i = 0; i < len2 - 1; i++) {
        const bigram = second.substring(i, i + 2);
        const count = firstBigrams.get(bigram)! | 0;

        if (count > 0) {
            firstBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (len1 + len2 - 2);
}

function findBestMatch(mainString: string, targetStrings: string[]) {
    const len = targetStrings.length;
    let bestMatchIndex = 0;
    let bestMatchRating = 0;
    for (let i = 0; i < len; i++) {
        const currentTargetString = targetStrings[i];
        const currentRating = compareTwoStrings(mainString, currentTargetString);
        if (currentRating > bestMatchRating) {
            bestMatchIndex = i;
            bestMatchRating = currentRating;
        }
    }
    return [bestMatchIndex, bestMatchRating];
}

export class FastSearcher {
    public targets: string[];
    constructor(targets: string[]) {
        this.targets = targets.map(t => t.toLowerCase().replace(/\s+/g, ''));
    }
    public search(query: string) {
        return findBestMatch(query.toLowerCase().replace(/\s+/g, ''), this.targets);
    }
}
