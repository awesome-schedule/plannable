/* eslint-disable @typescript-eslint/camelcase */
import lz from 'lz-string';

import { compressJSON, parseFromURL, SemesterStorage } from '@/store';
import empty_schedule from './test_data/empty_schedule.json';
import miscellaneousTest1 from './test_data/miscellaneousTest1.json';
import mySchedule2019Fall from './test_data/mySchedule2019Fall.json';
import test_filter from './test_data/test_filter.json';

function matchPartial(input: SemesterStorage, target: SemesterStorage) {
    const { schedule, ...others } = input;
    const { schedule: T_schedule, ...T_others } = target;

    expect(others).toEqual(T_others);
    const { proposedSchedules, ...others2 } = schedule;
    const { proposedSchedules: T_proposedSchedules, ...T_others2 } = T_schedule;

    expect(others2).toEqual(T_others2);
    expect(proposedSchedules.length).toBe(T_proposedSchedules.length);
    for (let i = 0; i < proposedSchedules.length; i++) {
        const { events, All } = proposedSchedules[i];
        const { events: T_events, All: T_All } = T_proposedSchedules[i];
        expect(T_events).toEqual(events);
        for (const [k, v] of Object.entries(All)) {
            // input may lose some keys due to course removal
            const secs = v,
                T_secs = T_All[k];
            if (secs instanceof Array) {
                expect(T_secs).toBeInstanceOf(Array);
                if (T_secs === -1) throw new Error(); // can never be -1
                for (let i = 0; i < secs.length; i++) {
                    const sec = secs[i];
                    const T_sec = T_secs[i];
                    for (const g of sec) {
                        expect(T_sec.find(s => s.id === g.id)).toBeTruthy(); // expect to find in T_secs
                    }
                }
            } else {
                expect(secs).toBe(T_secs); // -1 case
            }
        }
    }
}

describe('parseFromURL', () => {
    it('parse_empty_schedule', async () => {
        const urlCompressed = compressJSON(JSON.stringify(empty_schedule));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        expect(json).toMatchObject(empty_schedule);
    });
    it('parse_mySchedule2019Fall', async () => {
        const urlCompressed = compressJSON(JSON.stringify(mySchedule2019Fall));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        matchPartial(JSON.parse(JSON.stringify(json)), mySchedule2019Fall as any);
    });
    it('parse_test_filter', async () => {
        const urlCompressed = compressJSON(JSON.stringify(test_filter));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        matchPartial(JSON.parse(JSON.stringify(json)), test_filter as any);
    });
    it('parse_miscellaneousTest1', async () => {
        const urlCompressed = compressJSON(JSON.stringify(miscellaneousTest1));
        const URL = lz.compressToEncodedURIComponent(JSON.stringify(urlCompressed));
        const json = await parseFromURL(URL);
        matchPartial(JSON.parse(JSON.stringify(json)), miscellaneousTest1 as any);
    });
});
