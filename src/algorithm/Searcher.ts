/**
 * @module algorithm
 * @author Hanzhi Zhou
 */

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
export function compareTwoStrings(first: string, second: string) {
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
        const count = firstBigrams.get(bigram) || 0;

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
export interface SearchResult<T, K = string> {
    score: number;
    matches: number[];
    index: number;
    item: T;
    data: K;
}
/**
 * Fast searcher for fuzzy search among a list of strings
 */
export class FastSearcher<T, K = string> {
    public originals: string[] = [];

    public idxOffsets: Uint32Array;
    public indices: Uint32Array;

    private num2str: string[] = [];
    private maxTokenLen: number = 0;

    /**
     * @param targets the list of strings to search from
     */
    constructor(public items: T[], toStr: (a: T) => string, public data: K) {
        const allTokens: string[][] = [];
        let tokenLen = 0;
        this.idxOffsets = new Uint32Array(items.length + 1);
        for (let i = 0; i < items.length; i++) {
            const full = toStr(items[i])
                .toLowerCase()
                .trimEnd();
            const temp = full.split(/\s+/);
            this.originals.push(full);
            allTokens.push(temp);

            this.idxOffsets[i] = tokenLen;
            tokenLen += temp.length << 1;
            if (temp.length > this.maxTokenLen) this.maxTokenLen = temp.length;
        }
        this.idxOffsets[items.length] = tokenLen;

        this.indices = new Uint32Array(tokenLen);
        const str2num: Map<string, number> = new Map();
        for (let j = 0; j < allTokens.length; j++) {
            const tokens = allTokens[j];
            const offset = this.idxOffsets[j];
            const t0 = tokens[0];
            if (str2num.get(t0) === undefined) {
                str2num.set(t0, this.num2str.length);
                this.num2str.push(t0);
            }
            this.indices[offset] = str2num.get(t0)!;
            const original = this.originals[j];
            for (let i = 1; i < tokens.length; i++) {
                const token = tokens[i];
                if (str2num.get(token) === undefined) {
                    str2num.set(token, this.num2str.length);
                    this.num2str.push(token);
                }
                this.indices[offset + (i << 1)] = str2num.get(token)!;
                this.indices[offset + (i << 1) + 1] = original.indexOf(
                    token,
                    this.indices[offset + (i << 1) - 1] + tokens[i - 1].length
                );
            }
        }

        console.log('all tokens', tokenLen);
        console.log('unique tokens', this.num2str.length);
    }
    private constructQueryGrams(query: string, gramLen: number) {
        const queryGrams = new Map<string, number>();
        const queryGramCount = query.length - gramLen + 1;

        // keep frequencies in separated arrays for performance reasons
        // copying a Map is slow, but copying a typed array is fast
        const buffer = new ArrayBuffer(queryGramCount * 2);
        const freqCount = new Uint8Array(buffer, 0, queryGramCount);
        // the working copy
        const freqCountCopy = new Uint8Array(buffer, queryGramCount, queryGramCount);

        for (let j = 0, idx = 0; j < queryGramCount; j++) {
            const grams = query.substring(j, j + gramLen);
            const eIdx = queryGrams.get(grams);
            if (eIdx !== undefined) {
                freqCount[eIdx] += 1;
            } else {
                queryGrams.set(grams, idx);
                freqCount[idx++] = 1;
            }
        }
    }
    /**
     * sliding window search
     * @param query
     * @param maxWindow
     * @param gramLen
     */
    public sWSearch(query: string, gramLen = 3, threshold = 0.03, maxWindow?: number) {
        const t2 = query
            .trim()
            .toLowerCase()
            .split(/\s+/);
        query = t2.join(' ');
        if (query.length <= 2) return [];

        maxWindow = Math.max(maxWindow || t2.length, 2);

        /** map from n-gram to index in the frequency array */
        const queryGrams = new Map<string, number>();
        const queryGramCount = query.length - gramLen + 1;

        // keep frequencies in separated arrays for performance reasons
        // copying a Map is slow, but copying a typed array is fast
        const buffer = new ArrayBuffer(queryGramCount * 2);
        const freqCount = new Uint8Array(buffer, 0, queryGramCount);
        // the working copy
        const freqCountCopy = new Uint8Array(buffer, queryGramCount, queryGramCount);

        for (let j = 0, idx = 0; j < queryGramCount; j++) {
            const grams = query.substring(j, j + gramLen);
            const eIdx = queryGrams.get(grams);
            if (eIdx !== undefined) {
                freqCount[eIdx] += 1;
            } else {
                queryGrams.set(grams, idx);
                freqCount[idx++] = 1;
            }
        }

        const tokenScoreArr: number[][] = [];

        // compute score for each token
        for (const str of this.num2str) {
            const matches = [0];
            let intersectionSize = 0;
            freqCountCopy.set(freqCount);

            const tokenGramCount = str.length - gramLen + 1;
            for (let j = 0; j < tokenGramCount; j++) {
                const grams = str.substring(j, j + gramLen);
                const idx = queryGrams.get(grams);

                if (idx !== undefined && freqCountCopy[idx]-- > 0) {
                    intersectionSize++;
                    matches.push(j, j + gramLen);
                }
            }
            matches[0] = (2 * intersectionSize) / (queryGramCount + tokenGramCount);
            tokenScoreArr.push(matches);
        }

        // score & matches for each sentence
        const allMatches: SearchResult<T, K>[] = [];
        const scoreWindow = new Float32Array(this.maxTokenLen);
        for (let i = 0; i < this.originals.length; i++) {
            // if (!len1 && !len2) return [1, [0, 0]] as const; // if both are empty strings
            // if (!len1 || !len2) return [0, []] as const; // if only one is empty string
            // if (first === second) return [1, [0, len1]] as const; // identical
            // if (len1 === 1 && len2 === 1) return [0, []] as const; // both are 1-letter strings
            // if (len1 < 2 || len2 < 2) return [0, []] as const; // if either is a 1-letter string

            const matches = [];
            const offset = this.idxOffsets[i];

            // note: nextOffset - offset = num of words + 1
            // use the number of words as the window size in this string if maxWindow > number of words
            const tokenLen = (this.idxOffsets[i + 1] - this.idxOffsets[i]) >> 1;
            const window = Math.min(maxWindow, tokenLen);

            let score = 0,
                maxScore = 0;
            // initialize score window
            for (let j = 0; j < window; j++) {
                const values = tokenScoreArr[this.indices[offset + (j << 1)]];
                const v = values[0];
                score += scoreWindow[j] = v;

                if (v < threshold) continue;
                const temp = this.indices[offset + (j << 1) + 1];
                for (let m = 1; m < values.length; m++) {
                    matches.push(values[m] + temp);
                }
            }
            if (score > maxScore) maxScore = score;

            for (let j = window; j < tokenLen; j++) {
                // subtract the last score and add the new score
                score -= scoreWindow[j - window];
                const values = tokenScoreArr[this.indices[offset + (j << 1)]];
                const v = values[0];
                score += scoreWindow[j] = v;

                if (v < threshold) continue;
                if (score > maxScore) maxScore = score;

                const temp = this.indices[offset + (j << 1) + 1];
                for (let m = 1; m < values.length; m++) {
                    matches.push(values[m] + temp);
                }
            }

            allMatches.push({
                score: maxScore,
                matches,
                item: this.items[i],
                index: i,
                data: this.data
            });
        }

        return allMatches;
    }
}
