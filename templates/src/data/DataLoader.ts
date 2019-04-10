import axios from 'axios';
import cheerio from 'cheerio';
import { parse } from 'papaparse';
import querystring from 'querystring';
import CourseRecord from '../models/Course';
import { Semester } from '../models/Catalog';
import Meta, { RawCatalog, RawCourse, RawSection, RawMeeting } from '@/models/Meta';
import Meeting from '@/models/Meeting';
import { STATUS_CODES } from 'http';

const CROS_PROXY = 'https://cors-anywhere.herokuapp.com/';

/**
 * Fetch the list of semesters from Lou's list
 */
function getSemesterList(cros_proxy = CROS_PROXY, count = 5): Promise<Semester[]> {
    console.time('get semester list');
    return new Promise((resolve, reject) => {
        axios
            .get(`${cros_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/`)
            .then(response => {
                console.timeEnd('get semester list');
                console.time('parse semester list');
                const $ = cheerio.load(response.data);
                const records: Semester[] = [];
                const options = $('option').slice(0, count);
                options.each((i, element) => {
                    const key = element.attribs['value'].substr(-4);
                    const innerHTML = $(element).html();
                    if (innerHTML === null) return;
                    records.push({
                        id: key,
                        name: innerHTML
                            .split(' ')
                            .splice(0, 2)
                            .join(' ')
                    });
                });
                console.timeEnd('parse semester list');
                resolve(records);
            })
            .catch(error => {
                reject(error);
            });
    });
}

function getSemesterData(semesterId: string, cros_proxy = CROS_PROXY): Promise<RawCatalog> {
    console.time(`request semester ${semesterId} data`);
    return new Promise((resolve, reject) => {
        axios
            .post(
                `${cros_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
                querystring.stringify({
                    Semester: semesterId,
                    Group: 'CS',
                    Description: 'Yes',
                    submit: 'Submit Data Request',
                    Extended: 'Yes'
                })
            )
            .then(res => {
                console.timeEnd(`request semester ${semesterId} data`);
                return parseSemesterData(res.data);
            })
            .then(data => {
                resolve(data);
            })
            .catch(err => {
                reject(err);
            });
        // axios
        //     .get(`http://localhost:8000/CS${semesterId}Data.json`)
        //     .then(data => {
        //         resolve(data.data);
        //     })
        //     .catch(err => {
        //         reject(err);
        //     });
    });
}

function parseSemesterData(csv_string: string) {
    const CLASS_TYPES = Meta.TYPES_PARSE;
    const STATUSES = Meta.STATUSES_PARSE;
    console.time('parsing csv');
    const raw_data: string[][] = parse(csv_string, {
        skipEmptyLines: true,
        header: false
    }).data;
    console.timeEnd('parsing csv');
    console.time('reorganizing data');
    const rawCatalog: RawCatalog = {};

    for (let j = 1; j < raw_data.length; j++) {
        const data = raw_data[j];
        const key = (data[1] + data[2] + CLASS_TYPES[data[4]]).toLowerCase();
        const tempSection: RawSection = [
            parseInt(data[0]),
            data[3],
            data[23],
            STATUSES[data[24]],
            parseInt(data[25]),
            parseInt(data[26]),
            parseInt(data[27]),
            []
        ];
        const meetings: RawMeeting[] = [];
        for (let i = 0; i < 4; i++) {
            if (data[6 + i * 4] && data[6 + i * 4] !== '') {
                const tempMeeting: RawMeeting = [
                    data[6 + i * 4],
                    data[6 + i * 4 + 1],
                    data[6 + i * 4 + 2],
                    data[6 + i * 4 + 3]
                ];
                meetings.push(tempMeeting);
            }
        }
        tempSection[7] = meetings;
        if (rawCatalog[key]) {
            rawCatalog[key][6].push(tempSection);
        } else {
            rawCatalog[key] = [
                data[1],
                parseInt(data[2]),
                CLASS_TYPES[data[4]],
                data[5],
                data[22],
                data[28],
                [tempSection]
            ];
        }
    }

    console.timeEnd('reorganizing data');
    return rawCatalog;
}

export { getSemesterData, getSemesterList };
