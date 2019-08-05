import {convertJsonToArray} from '@/store';
import empty from './test_data/empty_schedule.json';
import mySchedule2019Fall from './test_data/mySchedule2019Fall.json';
import test_filter from './test_data/test_filter.json';

describe('url convertJsonToArray test', () => {
    it('empty_schedules', () => {
        const test1 = JSON.stringify(empty);
        const urlCompressed = JSON.parse(convertJsonToArray(test1));

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        // display
        // _earliest
        expect(urlCompressed[4]).toEqual('08:00');

        // _fullHeight
        expect(urlCompressed[5]).toEqual(40);

        // _latest
        expect(urlCompressed[6]).toEqual('19:00');

        // _maxNumSchedules
        expect(urlCompressed[7]).toEqual(100000);

        // _numSearchResults
        expect(urlCompressed[8]).toEqual(6);

        // _partialHeight
        expect(urlCompressed[9]).toEqual(25);

        // binary
        expect(urlCompressed[10]).toEqual(753);

        // filter
        // time slots
        expect(urlCompressed[11]).toEqual([]);

        // binary: allowWaitlist, etc
        expect(urlCompressed[12]).toEqual(7);

        // name initials ascii
        expect(urlCompressed[13]).toEqual(d);
        expect(urlCompressed[14]).toEqual(v);
        expect(urlCompressed[15]).toEqual(c);
        expect(urlCompressed[16]).toEqual(l);
        expect(urlCompressed[17]).toEqual(n);
        expect(urlCompressed[18]).toEqual(s);
        expect(urlCompressed[19]).toEqual(I);

        // binary
        expect(urlCompressed[20]).toEqual(5);
    });

    it('mySchedule2019Fall', () => {
        const test1 = JSON.stringify(mySchedule2019Fall);
        const urlCompressed = JSON.parse(convertJsonToArray(test1));

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        expect(urlCompressed[0]).toEqual('mySchedule2019Fall');

        // display
        // _earliest
        expect(urlCompressed[4]).toEqual('09:00');

        // _fullHeight
        expect(urlCompressed[5]).toEqual(100);

        // _latest
        expect(urlCompressed[6]).toEqual('19:00');

        // _maxNumSchedules
        expect(urlCompressed[7]).toEqual(5000);

        // _numSearchResults
        expect(urlCompressed[8]).toEqual(10);

        // _partialHeight
        expect(urlCompressed[9]).toEqual(25);

        // binary
        expect(urlCompressed[10]).toEqual(1265);

        // filter
        // time slots
        expect(urlCompressed[11]).toEqual([]);

        // binary: allowWaitlist, etc
        expect(urlCompressed[12]).toEqual(6);

        // name initials ascii
        expect(urlCompressed[13]).toEqual(d);
        expect(urlCompressed[14]).toEqual(v);
        expect(urlCompressed[15]).toEqual(c);
        expect(urlCompressed[16]).toEqual(l);
        expect(urlCompressed[17]).toEqual(n);
        expect(urlCompressed[18]).toEqual(s);
        expect(urlCompressed[19]).toEqual(I);

        // binary
        expect(urlCompressed[20]).toEqual(8465);
    });

    it('test_filter', () => {
        const test1 = JSON.stringify(test_filter);
        const urlCompressed = JSON.parse(convertJsonToArray(test1));

        // get filter name initial asciis
        const c = 'c'.charCodeAt(0);
        const d = 'd'.charCodeAt(0);
        const l = 'l'.charCodeAt(0);
        const n = 'n'.charCodeAt(0);
        const s = 's'.charCodeAt(0);
        const v = 'v'.charCodeAt(0);
        const I = 'I'.charCodeAt(0);

        expect(urlCompressed[0]).toEqual('test_filter');

        // display
        // _earliest
        expect(urlCompressed[4]).toEqual('09:00');

        // _fullHeight
        expect(urlCompressed[5]).toEqual(100);

        // _latest
        expect(urlCompressed[6]).toEqual('19:00');

        // _maxNumSchedules
        expect(urlCompressed[7]).toEqual(5000);

        // _numSearchResults
        expect(urlCompressed[8]).toEqual(10);

        // _partialHeight
        expect(urlCompressed[9]).toEqual(25);

        // binary
        expect(urlCompressed[10]).toEqual(1265);

        // filter
        // time slots
        expect(urlCompressed[11]).toEqual([]);

        // binary: allowWaitlist, etc
        expect(urlCompressed[12]).toEqual(6);

        // name initials ascii
        expect(urlCompressed[13]).toEqual(I);
        expect(urlCompressed[14]).toEqual(l);
        expect(urlCompressed[15]).toEqual(v);
        expect(urlCompressed[16]).toEqual(d);
        expect(urlCompressed[17]).toEqual(n);
        expect(urlCompressed[18]).toEqual(s);
        expect(urlCompressed[19]).toEqual(c);

        // binary
        expect(urlCompressed[20]).toEqual(10275);
    });
});
