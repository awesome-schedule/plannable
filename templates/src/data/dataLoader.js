// @ts-check
import axios from 'axios';
import cheerio from 'cheerio';

/**
 *
 * @param {(semesters: import('../models/AllRecords').Semester[])=>void} success
 * @param {(err: any)=>void} reject
 */
function getSemesterList(success, reject) {
    axios
        .get('https://cors-anywhere.herokuapp.com/https://rabi.phys.virginia.edu/mySIS/CS2/')
        .then(response => {
            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                /**
                 * @type {import('../models/AllRecords').Semester[]}
                 */
                const records = [];
                const options = $('option').slice(0, 5);
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
                success(records);
            }
        })
        .catch(error => {
            reject(error);
        });
}

export default getSemesterList;
