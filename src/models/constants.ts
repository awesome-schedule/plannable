export const dayToInt = Object.freeze({
    Mo: 0,
    Tu: 1,
    We: 2,
    Th: 3,
    Fr: 4,
    Sa: 5,
    Su: 6
});

export type Day = keyof typeof dayToInt;

export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
