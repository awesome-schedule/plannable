/**
 * This file prepares data for unit testing
 */

import { requestSemesterData } from '../../src/data/CatalogLoader';
import path from 'path';
import fs from 'fs';
import Catalog, { Semester } from '../../src/models/Catalog';

const datadir = path.join(__dirname, 'data');

if (!fs.existsSync(datadir)) {
    fs.mkdirSync(datadir);
}

const semester: Semester = {
    id: '1198',
    name: 'Fall 2019'
};
const filename = `CS${semester}Data.json`;
const filepath = path.join(datadir, filename);

async function getData() {
    let data: Catalog;
    if (fs.existsSync(filepath)) {
        data = Catalog.fromJSON(JSON.parse(fs.readFileSync(filepath).toString()));
    } else {
        data = await requestSemesterData(semester);

        // cache the data, if possible
        fs.writeFileSync(filepath, JSON.stringify(data));
    }
    return data;
}

export default getData();
