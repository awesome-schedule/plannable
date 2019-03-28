// @ts-check
import parse from 'csv-parse/lib/sync';
import axios from 'axios';
import querystring from 'querystring';
import CourseRecord from '../models/CourseRecord';
/**
 * @typedef {Object<string, import('../models/AllRecords').RawRecord>} RawAllRecords
 */

/**
 * @param {string} semesterId
 * @param {(x: RawAllRecords)=>void} callback
 */
function getSemesterData(semesterId, callback) {
    const url =
        'https://cors-anywhere.herokuapp.com/https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php';
    const asd = {
        Semester: semesterId,
        Group: 'CS',
        Description: 'Yes',
        submit: 'Submit Data Request'
    };
    console.time('request');
    axios
        .post(url, querystring.stringify(asd))
        .then(res => {
            console.timeEnd('request');
            parseSemesterData(res.data, callback);
        })
        .catch(err => {
            console.log(err);
        });
}

/**
 * @param {string} csv_string
 * @param {(x: RawAllRecords)=>void} callback
 */
function parseSemesterData(csv_string, callback) {
    console.time('parseData');
    /**
     * @type {string[][]}
     */
    const raw_data = parse(csv_string, {
        columns: false,
        skip_empty_lines: true
    });

    /**
     * @type {RawAllRecords}
     */
    const DICT = {};
    // console.log(raw_data[0]);
    for (let i = 1; i < raw_data.length; i++) {
        const row = raw_data[i];
        const key = (row[1] + row[2] + row[4]).toLowerCase();
        if (DICT[key]) {
            for (const i of CourseRecord.LIST) {
                const func = CourseRecord.PARSE_FUNC[i];
                if (func) {
                    DICT[key][i].push(func(row[i]));
                } else {
                    DICT[key][i].push(row[i]);
                }
            }
        } else {
            const parsedRow = [];
            for (let i = 0, j = 0; i < CourseRecord.LENGTH; i++) {
                const func = CourseRecord.PARSE_FUNC[i];
                const item = func ? func(row[i]) : row[i];
                if (i === CourseRecord.LIST[j]) {
                    parsedRow.push([item]);
                    j++;
                } else {
                    parsedRow.push(item);
                }
            }
            DICT[key] = parsedRow;
        }
    }
    console.timeEnd('parseData');
    callback(DICT);
}

export default getSemesterData;
