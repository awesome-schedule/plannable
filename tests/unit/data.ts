/**
 * This file prepares data for unit testing
 */

/**
 *
 */
import { requestSemesterData } from '@/data/CatalogLoader';
import Catalog, { SemesterJSON } from '@/models/Catalog';
import fs from 'fs';
import path from 'path';

declare global {
    namespace NodeJS {
        interface Global {
            queue: any[];
            postMessage: (msg: any) => void;
            msgHandler(msg: any): void;
        }
    }
}

const datadir = path.join(__dirname, 'data');

if (!fs.existsSync(datadir)) {
    fs.mkdirSync(datadir);
}

const semester: SemesterJSON = {
    id: '1198',
    name: 'Fall 2019'
};
const filename = `CS${semester.id}Data.json`;
const filepath = path.join(datadir, filename);

async function getData() {
    let data: Catalog;
    if (fs.existsSync(filepath)) {
        console.info('reading data from local cache...');
        data = Catalog.fromJSON(JSON.parse(fs.readFileSync(filepath).toString()));
    } else {
        console.info('Local cache does not exist. Requesting data from remote..');
        data = await requestSemesterData(semester);

        // cache the data, if possible
        fs.writeFileSync(filepath, JSON.stringify(data));
    }
    return data;
}

export default getData();
