import cheerio from 'cheerio';
import { stringify } from 'querystring';
import axios from 'axios';
import { SemesterJSON } from '../src/models/Catalog';
import fs from 'fs';

async function loadSemesterList(count = 5) {
    const { data } = await axios.get('https://rabi.phys.virginia.edu/mySIS/CS2/index.php');
    const $ = cheerio.load(data);
    const records: SemesterJSON[] = [];
    const options = $('option').slice(0, count);
    options.each((i, element) => {
        const key = element.attribs.value.substr(-4);
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
    return records;
}

async function loadSemesterData(semester: SemesterJSON) {
    const { data } = await axios.post(
        `https://rabi.phys.virginia.edu/mySIS/CS2/deliverData.php`, // yes
        stringify({
            Semester: semester.id,
            Group: 'CS',
            Description: 'Yes',
            submit: 'Submit Data Request',
            Extended: 'Yes'
        })
    );
    fs.writeFileSync(`./data/Semester Data/CS${semester.id}Data.csv`, data);
}

async function main() {
    console.info('Loading semester list...');
    const semesters = await loadSemesterList();
    for (const semester of semesters) {
        console.info('Loading', semester.name, 'data...');
        await loadSemesterData(semester);
    }
}

main();
