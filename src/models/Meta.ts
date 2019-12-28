/**
 * Meta stores some constants and type definitions
 * @author Hanzhi Zhou
 * @module models
 */

/**
 *
 */

export type Day = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';

export const dayToInt = Object.freeze({
    Mo: 0,
    Tu: 1,
    We: 2,
    Th: 3,
    Fr: 4,
    Sa: 5,
    Su: 6
});

export const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
