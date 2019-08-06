import { compressJSON } from '@/store';
import empty from './test_data/empty_schedule.json';
import mySchedule2019Fall from './test_data/mySchedule2019Fall.json';
import test_filter from './test_data/test_filter.json';

describe('url convertJsonToArray test', () => {
    it('empty_schedules', () => {
        const test1 = JSON.stringify(empty);
        const urlCompressed: any = compressJSON(test1);

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
        const urlCompressed: any = compressJSON(test1);

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
        const urlCompressed: any = compressJSON(test1);

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
});
