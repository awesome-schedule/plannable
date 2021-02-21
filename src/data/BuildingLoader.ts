/**
 * Script for loading building list and distance (time) matrix
 * @author Hanzhi Zhou
 * @module src/data
 */

/**
 *
 */
import Expirable from './Expirable';
import { fallback, loadFromCache } from './Loader';
import { dataend } from '@/config';

export interface TimeMatrixJSON extends Expirable {
    timeMatrix: number[];
}

export interface BuildingListJSON extends Expirable {
    buildingList: string[];
}

export function setupTimeMatrix(timeMatrix: Int32Array) {
    const M = window.NativeModule;
    const ptr = M._malloc(timeMatrix.byteLength);
    M.HEAP32.set(timeMatrix, ptr / 4);
    M._setTimeMatrix(ptr, timeMatrix.length ** 0.5);
}

/**
 * Try to load the walking time matrix between buildings from localStorage.
 * If it expires or does not exist,
 * load a fresh one from the data backend and store it in localStorage.
 *
 * storage key: "timeMatrix"
 */
export function loadTimeMatrix(force = false) {
    return fallback(
        loadFromCache<Int32Array, TimeMatrixJSON>(
            'timeMatrix',
            dataend.distances,
            x => Int32Array.from(x.timeMatrix),
            {
                expireTime: 1000 * 86400,
                force,
                store(x) {
                    localStorage.setItem(
                        'timeMatrix',
                        JSON.stringify({
                            modified: new Date(),
                            timeMatrix: Array.from(x)
                        })
                    );
                    return x;
                }
            }
        ),
        {
            succMsg: 'Walking distance matrix loaded',
            warnMsg: x => `Failed to load walking distance matrix: ${x}. Old data is used instead`,
            errMsg: x => `Failed to load walking distance matrix: ${x}. `,
            timeoutTime: 10000
        }
    );
}

/**
 * Try to load the array of the names of buildings from localStorage.
 * If it expires or does not exist,
 * load a fresh one from the data backend and store it in localStorage.
 *
 * storage key: "buildingList"
 */
export function loadBuildingSearcher(force = false) {
    return fallback(
        loadFromCache<string[], BuildingListJSON>(
            'buildingList',
            dataend.buildings,
            x => x.buildingList,
            {
                expireTime: 1000 * 86400,
                force
            }
        ),
        {
            succMsg: 'Building list loaded',
            warnMsg: x => `Failed to load building list: ${x}. Old data is used instead`,
            errMsg: x => `Failed to load building list: ${x}. `,
            timeoutTime: 10000
        }
    );
}
