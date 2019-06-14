declare module 'fast-fuzzy' {
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

    export interface SearchOptions<T> {
        threshold?: number;
        ignoreCase?: boolean;
        ignoreSymbols?: boolean;
        normalizeWhitespace?: boolean;
        returnMatchData?: boolean;
        useDamerau?: boolean;
        keySelector?(obj: T): (T[keyof T])[] | T[keyof T];
    }

    export class Searcher<T> {
        constructor(list: T[], options?: SearchOptions<T>);

        search(query: string, options?: object): SearchResult<T>[];
    }
}
