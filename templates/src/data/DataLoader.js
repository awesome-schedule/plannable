// @ts-check
import axios from 'axios';
import cheerio from 'cheerio';
import parse from 'csv-parse/lib/sync';
import querystring from 'querystring';
import CourseRecord from '../models/CourseRecord';
const CROS_PROXY = 'https://cors-anywhere.herokuapp.com/';
/**
 * @typedef {Object<string, import('../models/AllRecords').RawRecord>} RawAllRecords
 */
/**
 * Fetch the list of semesters from Lou's list
 * @param {string} cros_proxy
 * @param {number} count
 * @return {Promise<import('../models/AllRecords').Semester[]>}
 */
function getSemesterList(cros_proxy = CROS_PROXY, count = 5) {
    console.time('get semester list');
    return new Promise((resolve, reject) => {
        axios
            .get(`${cros_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/`)
            .then(response => {
                console.timeEnd('get semester list');
                console.time('parse semester list');
                const $ = cheerio.load(response.data);
                const records = [];
                const options = $('option').slice(0, count);
                options.each((i, element) => {
                    const key = element.attribs['value'].substr(-4);
                    records.push({
                        id: key,
                        name: $(element)
                            .html()
                            .split(' ')
                            .splice(0, 2)
                            .join(' ')
                    });
                });
                records.reverse();
                console.timeEnd('parse semester list');
                resolve(records);
            })
            .catch(error => {
                reject(error);
            });
    });
}

/**
 * @param {string} semesterId
 * @param {string} cros_proxy
 * @return {Promise<RawAllRecords>}
 */
function getSemesterData(semesterId, cros_proxy = CROS_PROXY) {
    console.time('request semester data');
    return new Promise((resolve, reject) => {
        axios
            .post(
                `${cros_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
                querystring.stringify({
                    Semester: semesterId,
                    Group: 'CS',
                    Description: 'Yes',
                    submit: 'Submit Data Request'
                })
            )
            .then(res => {
                console.timeEnd('request semester data');
                return parseSemesterData(res.data);
            })
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * @param {string} csv_string
 */
function parseSemesterData(csv_string) {
    console.time('parse semester data');
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
    console.timeEnd('parse semester data');
    return DICT;
}

export { getSemesterData, getSemesterList };
