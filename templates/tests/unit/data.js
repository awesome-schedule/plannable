/**
 * This file prepares data for unit testing
 */

const path = require('path');
const xlsx = require('node-xlsx');

const data_path = path.join(
    path.dirname(path.dirname(path.dirname(__dirname))),
    'new_sis',
    'data',
    'CS1192Data.xlsx'
);

console.log(`Parsing data from ${data_path}`);
const raw_data = xlsx.parse(data_path)[0].data;

const TYPES = {
    Clinical: 0,
    Discussion: 1,
    Drill: 2,
    'Independent Study': 3,
    Laboratory: 4,
    Lecture: 5,
    Practicum: 6,
    Seminar: 7,
    Studio: 8,
    Workshop: 9
};

const STATUSES = {
    Open: 1,
    Closed: 0,
    'Wait List': 2
};

/**
 * @type {Object<string, any[][]>}
 */
const DICT = {};

for (let i = 0; i < raw_data.length; i++) {
    const row = raw_data[i];

    row[4] = TYPES[row[4]];
    row[11] = STATUSES[row[11]];

    const category = row[1].toLowerCase();
    const number = row[2];
    const lecture = row[4];
    const key = category + number + lecture;
    if (DICT[key]) {
        DICT[key].push(row);
    } else {
        DICT[key] = [row];
    }
}
/**
 * @type {Object<string, [number[], string, number, number[], number, number, string[][], string[], string[], string, string[], number[], number[], number[], number[], string]>}
 */
const RECORDS_DICT = {};
for (const k in DICT) {
    const v = DICT[k];
    RECORDS_DICT[k] = [
        v.map(x => x[0]),
        v[0][1],
        v[0][2],
        v.map(x => x[3]),
        v[0][4],
        v[0][5],
        v.map(x => x[6].split(',')),
        v.map(x => x[7]),
        v.map(x => x[8]),
        v[0][9],
        v.map(x => x[10]),
        v.map(x => x[11]),
        v.map(x => x[12]),
        v.map(x => x[13]),
        v.map(x => x[14]),
        v[0][15]
    ];
}

export default RECORDS_DICT;
