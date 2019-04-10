/**
 * This file prepares data for unit testing
 */

import path from 'path';
import fs from 'fs';

const data_path = path.join(
    path.dirname(path.dirname(path.dirname(__dirname))),
    'backend',
    'data',
    'CS1198Data.json'
);

const data = JSON.parse(fs.readFileSync(data_path).toString());
// console.log(RECORDS_DICT);

export default data;
