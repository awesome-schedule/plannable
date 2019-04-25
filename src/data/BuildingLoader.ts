import axios from 'axios';
import { NotiMsg } from '@/models/Notification';

const api =
    window.location.host.indexOf('localhost') === -1 &&
    window.location.host.indexOf('127.0.0.1') === -1
        ? `${window.location.protocol}//${window.location.host}/`
        : 'http://localhost:8000/';

export async function loadTimeMatrix(): Promise<NotiMsg<Int32Array>> {
    const res = await axios.get(`${api}/data/time_matrix.json`);
    const data: number[][] = res.data;

    if (data instanceof Array && data.length) {
        const flattened = new Int32Array(data.length ** 2);

        for (let i = 0; i < data.length; i++) flattened.set(data[i], i * data.length);

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
        return (window.buildingList = data);
    } else {
        throw new Error('Data format error');
    }
}
