/**
 * Script for loading building list and distance (time) matrix
 * @author Hanzhi Zhou
 * @module data
 */

/**
 *
 */
import axios from 'axios';
import { getApi } from '.';
import Expirable from './Expirable';
import { fallback, loadFromCache } from './Loader';

export interface TimeMatrixJSON extends Expirable {
    timeMatrix: number[];
}

export interface BuildingListJSON extends Expirable {
    buildingList: string[];
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
            requestTimeMatrix,
            x => Int32Array.from(x.timeMatrix),
            {
                expireTime: 1000 * 86400,
                force
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
export function loadBuildingList(force = false) {
    return fallback(
        loadFromCache<string[], BuildingListJSON>(
            'buildingList',
            requestBuildingList,
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

/**
 * request from remote and store in localStorage
 */
export async function requestTimeMatrix(): Promise<Int32Array> {
    const res = await axios.get(`${getApi()}/data/Distance/Time_Matrix.json`);
    const data: number[][] = res.data;

    if (data instanceof Array && data.length) {
        const len = data.length;
        const flattened = new Int32Array(len ** 2);
        for (let i = 0; i < len; i++) flattened.set(data[i], i * len);

        localStorage.setItem(
            'timeMatrix',
            JSON.stringify({
                modified: new Date().toJSON(),
                timeMatrix: Array.from(flattened)
            })
        );

        return flattened;
    } else {
        throw new Error('Data format error');
    }
}

/**
 * request from remote and store in localStorage
 */
export async function requestBuildingList(): Promise<string[]> {
    const res = await axios.get(`${getApi()}/data/Distance/Building_Array.json`);
    const data = res.data;
    if (data instanceof Array && typeof data[0] === 'string') {
        localStorage.setItem(
            'buildingList',
            JSON.stringify({
                modified: new Date().toJSON(),
                buildingList: data
            })
        );

        return data;
    } else {
        throw new Error('Data format error');
    }
}
