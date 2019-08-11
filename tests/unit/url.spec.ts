import lz from 'lz-string';

import { compressJSON, parseFromURL } from '@/store';
import empty_schedule from './test_data/empty_schedule.json';
import miscellaneousTest1 from './test_data/miscellaneousTest1.json';
import mySchedule2019Fall from './test_data/mySchedule2019Fall.json';
import test_filter from './test_data/test_filter.json';

// display_keys: "combineSections","enableFuzzy","enableLog","expandOnEntering","multiSelect",
// "showClasslistTitle","showInstructor","showRoom","showTime","showWeekend","standard"

// filter: allowClosed, allowWaitlist, mode from binary
describe('url convertJsonToArray test', () => {
    it('empty_schedules', () => {
        const test1 = JSON.stringify(empty_schedule);
        const urlCompressed = compressJSON(test1);

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);
        console.warn(urlCompressed);

        // display
        const display_test = urlCompressed[4];

        // binary
        expect(display_test[0]).toEqual(753);

        // _earliest
        expect(display_test[1]).toEqual('08:00');

        // _fullHeight
        expect(display_test[2]).toEqual(40);

        // _latest
        expect(display_test[3]).toEqual('19:00');

        // _maxNumSchedules
        expect(display_test[4]).toEqual(100000);

        // _numSearchResults
        expect(display_test[5]).toEqual(6);

        // _partialHeight
        expect(display_test[6]).toEqual(25);

        // filter
        const filter_test = urlCompressed[5];

        // binary: allowWaitlist, etc
        expect(filter_test[0]).toEqual(7);
        // binary
        expect(filter_test[1]).toEqual(5);

        // name initials ascii
        const ascii_test = filter_test[2];
        expect(ascii_test[0]).toEqual(d);
        expect(ascii_test[1]).toEqual(v);
        expect(ascii_test[2]).toEqual(c);
        expect(ascii_test[3]).toEqual(l);
        expect(ascii_test[4]).toEqual(n);
        expect(ascii_test[5]).toEqual(s);
        expect(ascii_test[6]).toEqual(I);

        // time slots
        expect(filter_test[3]).toEqual([]);
    });

    it('mySchedule2019Fall', () => {
        const test1 = JSON.stringify(mySchedule2019Fall);
        const urlCompressed = compressJSON(test1);

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        expect(urlCompressed[0]).toEqual('mySchedule2019Fall');
        console.warn('fal2019', urlCompressed);
        // display
        const display_test = urlCompressed[4];

        // binary
        // expect(display_test[0]).toEqual(1265);

        // _earliest
        expect(display_test[1]).toEqual('09:00');

        // _fullHeight
        expect(display_test[2]).toEqual(100);

        // _latest
        expect(display_test[3]).toEqual('19:00');

        // _maxNumSchedules
        expect(display_test[4]).toEqual(5000);

        // _numSearchResults
        expect(display_test[5]).toEqual(10);

        // _partialHeight
        expect(display_test[6]).toEqual(25);

        // filter
        const filter_test = urlCompressed[5];

        // binary: allowWaitlist, etc
        expect(filter_test[0]).toEqual(6);
        // binary
        expect(filter_test[1]).toEqual(8465);

        // name initials ascii
        const ascii_test = filter_test[2];
        expect(ascii_test[0]).toEqual(d);
        expect(ascii_test[1]).toEqual(v);
        expect(ascii_test[2]).toEqual(c);
        expect(ascii_test[3]).toEqual(l);
        expect(ascii_test[4]).toEqual(n);
        expect(ascii_test[5]).toEqual(s);
        expect(ascii_test[6]).toEqual(I);

        // time slots
        expect(filter_test[3]).toEqual([]);
    });

    it('test_filter', () => {
        const test1 = JSON.stringify(test_filter);
        const urlCompressed = compressJSON(test1);

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        expect(urlCompressed[0]).toEqual('test_filter');
        console.warn('test_filter', urlCompressed);

        // display
        const display_test = urlCompressed[4];

        // binary
        expect(display_test[0]).toEqual(1265);

        // _earliest
        expect(display_test[1]).toEqual('09:00');

        // _fullHeight
        expect(display_test[2]).toEqual(100);

        // _latest
        expect(display_test[3]).toEqual('19:00');

        // _maxNumSchedules
        expect(display_test[4]).toEqual(5000);

        // _numSearchResults
        expect(display_test[5]).toEqual(10);

        // _partialHeight
        expect(display_test[6]).toEqual(25);

        // filter
        const filter_test = urlCompressed[5];

        // binary: allowWaitlist, etc
        expect(filter_test[0]).toEqual(6);

        // binary
        expect(filter_test[1]).toEqual(10275);

        // name initials ascii
        const ascii_test = filter_test[2];
        expect(ascii_test[0]).toEqual(I);
        expect(ascii_test[1]).toEqual(l);
        expect(ascii_test[2]).toEqual(v);
        expect(ascii_test[3]).toEqual(d);
        expect(ascii_test[4]).toEqual(n);
        expect(ascii_test[5]).toEqual(s);
        expect(ascii_test[6]).toEqual(c);

        // time slots
        expect(filter_test[3]).toEqual([]);
    });

    it('miscellaneousTest1', () => {
        const test1 = JSON.stringify(miscellaneousTest1);
        const urlCompressed = compressJSON(test1);

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        expect(urlCompressed[0]).toEqual('miscellaneousTest1');
        console.warn('miscellaneousTest1', urlCompressed);

        // display
        const display_test = urlCompressed[4];

        // binary
        expect(display_test[0]).toEqual(1023);

        // _earliest
        expect(display_test[1]).toEqual('10:00');

        // _fullHeight
        expect(display_test[2]).toEqual(40);

        // _latest
        expect(display_test[3]).toEqual('21:00');

        // _maxNumSchedules
        expect(display_test[4]).toEqual(100000);

        // _numSearchResults
        expect(display_test[5]).toEqual(6);

        // _partialHeight
        expect(display_test[6]).toEqual(25);

        // filter
        const filter_test = urlCompressed[5];

        // binary: allowWaitlist, etc
        expect(filter_test[0]).toEqual(3);

        // binary
        expect(filter_test[1]).toEqual(10942);

        // name initials ascii
        const ascii_test = filter_test[2];
        expect(ascii_test[0]).toEqual(I);
        expect(ascii_test[1]).toEqual(d);
        expect(ascii_test[2]).toEqual(v);
        expect(ascii_test[3]).toEqual(s);
        expect(ascii_test[4]).toEqual(c);
        expect(ascii_test[5]).toEqual(l);
        expect(ascii_test[6]).toEqual(n);

        // time slots
        expect(filter_test[3]).toEqual([]);

        // schedule
        const schedule_test = urlCompressed[6];

        // currentScheduleIndex
        expect(schedule_test[0]).toEqual(6);

        // proposedScheduleIndex
        expect(schedule_test[1]).toEqual(2);

        // cpIndex
        expect(schedule_test[2]).toEqual(1);

        // generated: Boolean(obj[3]),
        expect(schedule_test[3]).toEqual(0);

        // schedule length
        const schedules = schedule_test[4];
        console.warn('schedules', schedules);
        expect(schedules.length).toEqual(3);

        // length with no events
        expect(schedules[0].length).toEqual(1);

        // schedule[0] length
        const schedule0 = schedules[0][0];
        expect(Object.keys(schedule0).length).toEqual(5);

        // schedule[1] length
        const schedule1 = schedules[1][0];
        expect(Object.keys(schedule1).length).toEqual(2);

        // schedule[1] length
        const schedule2 = schedules[2][0];
        expect(Object.keys(schedule2).length).toEqual(1);

        // palette
        const palette_test = urlCompressed[7];
        expect(Object.keys(palette_test).length).toEqual(5);
    });
});

describe('parseFromURL', () => {
    it('parse_empty_schedule', async () => {
        const urlCompressed = compressJSON(JSON.stringify(empty_schedule));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        expect(JSON.parse(JSON.stringify(json))).toEqual(empty_schedule);
    });
    it('parse_mySchedule2019Fall', async () => {
        const urlCompressed = compressJSON(JSON.stringify(mySchedule2019Fall));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        expect(JSON.parse(JSON.stringify(json))).toEqual(mySchedule2019Fall);
    });
    it('parse_test_filter', async () => {
        const urlCompressed = compressJSON(JSON.stringify(test_filter));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        expect(JSON.parse(JSON.stringify(json))).toEqual(test_filter);
    });
    it('parse_miscellaneousTest1', async () => {
        const urlCompressed = compressJSON(JSON.stringify(miscellaneousTest1));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        expect(JSON.parse(JSON.stringify(json))).toEqual(miscellaneousTest1);
    });
});
