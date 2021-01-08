declare module 'fast-fuzzy' {
    /**
     * note: Match index and length are in terms of the original, non-normalized string
     */
    export interface SearchResult<T> {
        item: T;
        original: string;
        key: string;
        score: number;
        match: {
            index: number;
            length: number;
        };
    }

    export interface FuzzyOptions {
        /**
         * normalize case by calling `toLower` on input and pattern.
         * default: true
         */
        ignoreCase?: boolean;
        /**
         * strip non-word symbols** from input.
         * default: true
         *
         * symbols include `` `~!@#$%^&*()-=_+{}[]\|\;':",./<>? ``
         */
        ignoreSymbols?: boolean;
        /**
         * normalize and trim whitespace
         */
        normalizeWhitespace?: boolean;
        /**
         * return match data
         */
        returnMatchData?: boolean;
        /**
         * use damerau-levenshtein distance
         */
        useDamerau?: boolean;
    }

    /**
     * fuzzy ranking algorithm; returns match strength
     */
    export function fuzzy(x: string, y: string, opt?: FuzzyOptions): number;

    export interface SearchOptions<T> extends FuzzyOptions {
        /**
         * the minimum score that can be returned.
         * default: 0.6
         */
        threshold?: number;
        /**
         * selects the string(s)* to search when candidates are objects.
         * default: identity function s => s
         */
        keySelector?(obj: T): T[keyof T][] | T[keyof T] | T;
    }

    export interface ReturnMatchData {
        returnMatchData: true;
    }

    export interface NoMatchData {
        returnMatchData: false;
    }

    /**
     * for one-off searches; returns a sorted array of matches
     */
    export function search<T, Opt extends SearchOptions<T>>(
        query: string,
        options?: Opt
    ): Opt extends ReturnMatchData ? SearchResult<T>[] : T[];

    /**
     * for searching the same set of candidates multiple times; caches the constructed trie
     */
    export class Searcher<T, Options extends SearchOptions<T>> {
        /**
         * supply the options and initial list of candidates
         */
        constructor(list: T[], options?: Options);

        /**
         * add new candidates to the list
         */
        add(...candidates: T[]): void;

        /**
         * perform a search against the instance's candidates
         */
        search<Opt extends SearchOptions<T>>(
            query: string,
            options?: Opt
        ): Opt extends ReturnMatchData
            ? SearchResult<T>[]
            : Opt extends NoMatchData
            ? T[]
            : Options extends ReturnMatchData
            ? SearchResult<T>[]
            : T[];
    }
}
