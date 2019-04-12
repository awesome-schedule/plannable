/**
 * This file prepares data for unit testing
 */

import { RawCatalog } from '../../src/models/Meta';
import 'node';
import path from 'path';
import fs from 'fs';

const data_path = path.join(
    path.dirname(path.dirname(path.dirname(__dirname))),
    'backend',
    'data',
    'CS1198Data.json'
);

const data: RawCatalog = JSON.parse(fs.readFileSync(data_path).toString());

export default data;
