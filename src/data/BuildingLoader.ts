import axios from 'axios';
import { NotiMsg } from '@/models/Notification';

const api =
    window.location.host.indexOf('localhost') === -1 &&
    window.location.host.indexOf('127.0.0.1') === -1
        ? `${window.location.protocol}//${window.location.host}/`
        : 'http://localhost:8000/';

/**
 * Try to load walking time matrix between buildings from localStorage.
 * If it expires or does not exist,
 * load a fresh one from data backend and store it in localStorage.
 *
 * storage key: "timeMatrix"
 */
export async function loadTimeMatrix(): Promise<NotiMsg<Int32Array>> {
    const res = await axios.get(`${api}/data/time_matrix.json`);
    const data: number[][] = res.data;

    if (data instanceof Array && data.length) {
        const flattened = new Int32Array(data.length ** 2);

        for (let i = 0; i < data.length; i++) flattened.set(data[i], i * data.length);

        localStorage.setItem(
            'timeMatrix',
            JSON.stringify({
                modified: new Date().toJSON(),
                timeMatrix: Array.from(flattened)
            })
        );

        return {
            payload: window.timeMatrix = flattened,
            msg: 'success',
            level: 'info'
        };
    } else {
        throw new Error('Failed to fetch building matrix');
        // return {
        //     msg: 'Failed to fetch building matrix',
        //     level: 'error'
        // };
    }
}

export async function loadBuildingList(): Promise<string[]> {
    const res = await axios.get(`${api}/data/building_list.json`);
    const data = res.data;
    if (data instanceof Array && typeof data[0] === 'string') {
        localStorage.setItem(
            'buildingList',
            JSON.stringify({
                modified: new Date().toJSON(),
                buildingList: data
            })
        );

        return (window.buildingList = data);
    } else {
        throw new Error('Data format error');
    }
}
