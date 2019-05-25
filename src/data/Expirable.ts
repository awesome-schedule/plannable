/**
 * An interface that comes with a `modified` property, which allows one
 * to check whether something has expired.
 */
export default interface Expirable {
    /**
     * the JSON representation of a Date object, representing the time when this expirable object is created
     */
    readonly modified: string;
}
