import axios, { AxiosError } from 'axios';
import { parse } from 'papaparse';
import querystring from 'querystring';
import { Semester } from '../models/Catalog';
import Meta, { RawCatalog, RawSection, RawMeeting } from '../models/Meta';

// currently the two pages that we use has the cross origin header,
// so no need to use cross origin proxy
const CORS_PROXY = '';

/**
 * Fetch the list of semesters from Lou's list
 */
export function getSemesterList(cors_proxy = CORS_PROXY, count = 5): Promise<Semester[]> {
    console.time('get semester list');
    return new Promise((resolve, reject) => {
        axios
            .get(`${cors_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/index.php`)
            .then(response => {
                console.timeEnd('get semester list');
                console.time('parse semester list');
                const element = document.createElement('html');
                element.innerHTML = response.data;
                const options = element.getElementsByTagName('option');
                const records: Semester[] = [];
                for (let i = 0; i < Math.min(count, options.length); i++) {
                    const option = options[i];
                    const key = option.getAttribute('value');
                    if (key) {
                        const semesterId = key.substr(-4);
                        const html = option.innerHTML;
                        records.push({
                            id: semesterId,
                            name: html
                                .split(' ')
                                .splice(0, 2)
                                .join(' ')
                        });
                    }
                }
                console.timeEnd('parse semester list');
                resolve(records);
            })
            .catch((error: AxiosError) => {
                reject(error);
            });
    });
}

export function getSemesterData(semesterId: string, cors_proxy = CORS_PROXY): Promise<RawCatalog> {
    console.time(`request semester ${semesterId} data`);
    return new Promise((resolve, reject) => {
        axios
            .post(
                `${cors_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
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
            .catch((err: AxiosError | Error) => {
                reject(err);
            });
    });
}

export function parseSemesterData(csv_string: string) {
    const CLASS_TYPES = Meta.TYPES_PARSE;
    const STATUSES = Meta.STATUSES_PARSE;
    console.time('parsing csv');
    const raw_data: string[][] = parse(csv_string, {
        skipEmptyLines: true,
        header: false
    }).data;
    console.timeEnd('parsing csv');
    console.time('reorganizing data');

    const rawCatalog: RawCatalog = Object.create(null);

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
