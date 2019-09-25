import fs from 'fs';
import { parse } from 'papaparse';

const data = fs.readFileSync(`${__dirname}/data/Semester Data/CS1198Data.csv`).toString();

const result = new Set(
    parse(data, {
        header: false
    }).data.map(r => r[4])
);

console.log(result);
