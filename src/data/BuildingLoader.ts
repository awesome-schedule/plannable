import axios from 'axios';

// currently the two pages that we use has the cross origin header,
// so no need to use cross origin proxy

const api =
    window.location.host.indexOf('localhost') === -1 &&
    window.location.host.indexOf('127.0.0.1') === -1
        ? `${window.location.protocol}//${window.location.host}/`
        : 'http://localhost:8000/';

export async function fetchTimeMatrix(): Promise<Int32Array> {
    const res = await axios.get(`${api}/data/time_matrix.json`);
    const data: number[][] = res.data;
    if (data instanceof Array && data.length) {
        const flattened = new Int32Array(data.length ** 2);
        for (let i = 0; i < data.length; i++) {
            flattened.set(data[i], i * data.length);
        }
        window.timeMatrix = flattened;
        return flattened;
    } else {
        throw new Error('Data format error');
    }
}

export async function fetchBuildingList(): Promise<string[]> {
    const res = await axios.get(`${api}/data/building_list.json`);
    const data = res.data;
    if (data instanceof Array && typeof data[0] === 'string') {
        return (window.buildingList = data);
    } else {
        throw new Error('Data format error');
    }
}
