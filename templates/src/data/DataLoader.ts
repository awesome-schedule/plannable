import axios from 'axios';
import cheerio from 'cheerio';
import { parse } from 'papaparse';
import querystring from 'querystring';
import Course from '../models/Course';
import { Semester } from '../models/Catalog';
import { RawCatalog } from '@/models/Meta';

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
        // axios
        //     .post(
        //         `${cros_proxy}https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`,
        //         querystring.stringify({
        //             Semester: semesterId,
        //             Group: 'CS',
        //             Description: 'Yes',
        //             submit: 'Submit Data Request'
        //         })
        //     )
        //     .then(res => {
        //         console.timeEnd(`request semester ${semesterId} data`);
        //         return parseSemesterData(res.data);
        //     })
        //     .then(data => {
        //         resolve(data);
        //     })
        //     .catch(err => {
        //         reject(err);
        //     });
        axios
            .get(`http://localhost:8000/CS${semesterId}Data.json`)
            .then(data => {
                resolve(data.data);
            })
            .catch(err => {
                reject(err);
            });
    });
}

function parseSemesterData(csv_string: string) {
    console.time('parsing csv');
    const raw_data: string[][] = parse(csv_string, {
        skipEmptyLines: true,
        header: false
    }).data;
    console.timeEnd('parsing csv');
    console.time('reorganizing data');
    const DICT: RawCatalog = {};

    console.timeEnd('reorganizing data');
    return DICT;
}

export { getSemesterData, getSemesterList };
