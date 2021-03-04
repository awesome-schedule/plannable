/**
 * @module src/algorithm
 * @author Hanzhi Zhou
 */

/**
 * The structure of the object used to store search results
 */
export interface SearchResult<T, K = string> {
    /** the score of this result */
    score: number;
    /** an array of pairs indicating the indices of match. [[1,2], [7,9]] means that the indices [1, 2) and [7, 9) of the string are matched */
    matches: Int32Array;
    /** index of the item in the original list */
    index: number;
    /** some arbitrary data associated with this item */
    data: K;
}

function allocateStr(Module: EMModule, str: string) {
    // TODO: handle complete UTF-8
    // stringToUT8 will write exactly strLen number of bytes only if str contains ASCII characters only
    const strLen = str.length + 1;
    const ptr = Module._malloc(strLen);
    Module.stringToUTF8(str, ptr, strLen);
    return ptr;
}

/**
 * sanitize a query string, copy it to the WebAssembly heap and returns a pointer to it
 * returns -1 if query is shorter than gramLen
 */
function prepareQuery(Module: EMModule, query: string, gramLen: number) {
    query = query
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
    if (query.length < gramLen) return -1;
    return allocateStr(Module, query);
}

/**
 * Fast searcher for fuzzy search among a list of strings
 */
export class FastSearcher<T, K = string> {
    public readonly originals: string[] = [];
    /** internal pointer to the FastSearcher instance on WASM heap */
    private readonly ptr: number;
    constructor(
        items: readonly T[],
        toStr: (a: T) => string = x => x as any,
        public data: K = '' as any
    ) {
        const Module = window.NativeModule;
        const strArrPtr = Module._malloc(items.length * 4);
        for (let i = 0; i < items.length; i++) {
            const str = toStr(items[i]);
            this.originals.push(str);
            Module.HEAPU32[strArrPtr / 4 + i] = allocateStr(Module, str.trim().toLowerCase());
        }
        this.ptr = Module._getSearcher(strArrPtr, items.length);
    }

    sWSearch(query: string, numResults: number, gramLen = 3, threshold = 0.1) {
        const Module = window.NativeModule;
        const ptr = prepareQuery(Module, query, gramLen);
        const allMatches: SearchResult<T, K>[] = [];
        if (ptr === -1) return allMatches;

        const resultPtr = Module._sWSearch(this.ptr, ptr, numResults, gramLen, threshold) / 4;
        const total = Math.min(numResults, this.originals.length);
        const idxArr = Module.HEAP32.subarray(resultPtr, resultPtr + total);
        for (let i = 0; i < total; i++) {
            const idx = idxArr[i];
            const matchPtr = Module._getMatches(this.ptr, idx) / 4;
            allMatches.push({
                score: Module._getScore(this.ptr, idx),
                index: idx,
                data: this.data,
                matches: Module.HEAP32.subarray(
                    matchPtr,
                    matchPtr + Module._getMatchSize(this.ptr, idx) * 2
                )
            });
        }
        return allMatches;
    }

    /**
     * @param query
     * @returns [best match index, score of the best match]
     */
    public findBestMatch(query: string): readonly [number, number] {
        const Module = window.NativeModule;
        const ptr = prepareQuery(Module, query, 2);
        if (ptr === -1) return [0, 0.0];

        const idx = Module._findBestMatch(this.ptr, ptr);
        return [idx, Module._getScore(this.ptr, idx)];
    }

    public toJSON() {
        return this.originals;
    }
}

(window as any).FastSearcher = FastSearcher;
