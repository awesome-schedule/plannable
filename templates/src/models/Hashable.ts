export default interface Hashable {
    key: string;
    hash: () => number;
}
