import axios from 'axios';
import cheerio from 'cheerio';
import { spawn } from 'child_process';
import fs from 'fs';
import { stringify } from 'querystring';
import { SemesterJSON } from '../src/models/Catalog';

const dataDir = './data/Semester Data/';
function cb(err: NodeJS.ErrnoException | null) {
    if (err) console.error(err);
}

async function loadSemesterList(count = 10) {
    const { data } = await axios.get<string>('https://louslist.org/index.php');
    const $ = cheerio.load(data);
    fs.writeFile(dataDir + 'index.html', data, cb);
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

export async function loadSemesterData(semester: SemesterJSON) {
    const { data } = await axios.post<string>(
        `https://louslist.org/deliverData.php`, // yes
        stringify({
            Semester: semester.id,
            Group: 'CS',
            Description: 'Yes',
            submit: 'Submit Data Request',
            Extended: 'Yes'
        })
    );
    fs.writeFile(`./data/Semester Data/CS${semester.id}Data.csv`, data, cb);
    return data;
}

async function main() {
    console.info('Loading semester list...');
    try {
        const semesters = await loadSemesterList();
        for (const semester of semesters) {
            console.info('Loading', semester.name, 'data...');
            await loadSemesterData(semester);
        }
    } catch (e) {
        console.error(e);
        return;
    }

    const update = spawn('bash', ['./auto_update.sh']);
    update.stdout.on('data', data => {
        console.log(data.toString());
    });
    update.stderr.on('data', data => {
        console.warn(data.toString());
    });
    update.on('exit', code => {
        console.log('child process exited with code ' + code);
    });
}

main();

// hourly update
const updateInterval = 1000 * 3600;
setInterval(main, updateInterval);
