declare module 'quickselect' {
    function quickselect<T>(
        arr: T[],
        k: number,
        left: number,
        right: number,
        compare: (x: T, y: T) => number
    ): void;
    export default quickselect;
}
