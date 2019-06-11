import cheerio from 'cheerio';
import { stringify } from 'querystring';
import axios from 'axios';
import { SemesterJSON } from '../src/models/Catalog';

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

async function main() {
    const semesters = await loadSemesterList();
    console.log(semesters);
}

main();
