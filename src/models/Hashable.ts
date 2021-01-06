/**
 * @module src/models
 */

/**
 * A hashable object has a key and a function that returns an integer hash on that key
 */
export default interface Hashable {
    key: string;
    hash: () => number;
}
