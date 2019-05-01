/**
 * An interface that comes with a `modified` property, which allows one
 * to check whether something has expired.
 *
 * @property modified: the JSON representation of a Date object
 */
export default interface Expirable {
    readonly modified: string;
}
