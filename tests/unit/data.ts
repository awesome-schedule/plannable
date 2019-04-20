/**
 * This file prepares data for unit testing
 */

import { RawCatalog } from '../../src/models/Meta';
import { getSemesterData } from '../../src/data/DataLoader';
import path from 'path';
import fs from 'fs';

const datadir = path.join(__dirname, 'data');

if (!fs.existsSync(datadir)) {
    fs.mkdirSync(datadir);
}

const semester = '1198';
const filename = `CS${semester}Data.json`;
const filepath = path.join(datadir, filename);

async function getData() {
    let data: RawCatalog;
    if (fs.existsSync(filepath)) {
        data = JSON.parse(fs.readFileSync(filepath).toString());
    } else {
        data = await getSemesterData(semester);
    }
    return data;
}

export default getData();
