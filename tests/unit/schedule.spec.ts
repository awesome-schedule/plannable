import 'jest';
import Schedule from '../../src/models/Schedule';
import * as Utils from '../../src/utils';
import data from './data';
import Section from '../../src/models/Section';

beforeAll(async () => {
    window.catalog = await data;
});

describe('Schedule Test', () => {
    it('Schedule Color Hash', async () => {
        const len = Schedule.bgColors.length;
        const frequencies = new Float32Array(len);
        const { raw_data } = await data;
        for (const key in raw_data) {
            const hash = Utils.hashCode(key) % len;
            frequencies[hash] += 1;
        }
        const sum = frequencies.reduce((acc, x) => acc + x, 0);
        const prob = frequencies.map(x => (x * 100) / sum);
        // console.log(prob);
        // we expect the hashes to be quite uniformly distributed
        expect(prob.some(x => x > 11)).toBe(false);
    });

    it('schedule set color', () => {
        const schedule = new Schedule();
        expect(schedule.getColor({ key: 'cs11105', hash: () => Utils.hashCode('cs11105') })).toBe(
            '#CC9393'
        );
        schedule.setColor({ key: 'cs11105', hash: () => Utils.hashCode('cs11105') }, '#ffffff');
        expect(schedule.getColor({ key: 'cs11105', hash: () => Utils.hashCode('cs11105') })).toBe(
            '#ffffff'
        );
    });

    it('From Json new', () => {
        const json = `{"All":{"cs21505":[0],"cs21504":[1], "cs11105": -1},
        "id":1,"title":"Schedule","events":[],"savedColors":{"cs21505":"#af2007","cs21504":"#068239"}}`;
        const parsed = JSON.parse(json);
        const schedule = Schedule.fromJSON(parsed)!;
        expect(schedule).toBeTruthy();
        expect(schedule.All).toEqual({
            cs21505: new Set([0]),
            cs21504: new Set([1]),
            cs11105: -1
        });
    });

    // backward compatibility test
    it('From Json old', () => {
        const json = `{"All":{"cs2150lecture":[0],"cs2150laboratory":[1], "cs1110lecture": -1},
        "id":1,"title":"Schedule","events":[]}`;
        const parsed = JSON.parse(json);
        const schedule = Schedule.fromJSON(parsed)!;
        expect(schedule).toBeTruthy();
        expect(schedule.All).toEqual({
            cs21505: new Set([0]),
            cs21504: new Set([1]),
            cs11105: -1
        });
    });

    it('add/update course', () => {
        const schedule = new Schedule();
        expect(schedule.All).toEqual({});
        schedule.update('cs11105', 1);
        expect(schedule.All).toEqual({ cs11105: new Set([1]) });
        schedule.update('cs11105', 1);
        expect(schedule.All).toEqual({});
        schedule.update('cs11105', 1);
        schedule.update('cs11105', 1, false);
        expect(schedule.All).toEqual({ cs11105: new Set() });

        schedule.update('cs21105', -1);
        schedule.update('cs21504', 0);
        schedule.update('cs21504', 1);
        schedule.update('cs21504', 2);
        schedule.update('cs21505', -1);
        schedule.update('cs11105', 0);
        schedule.addEvent('MoTu 12:00AM - 3:00AM', true);
        schedule._computeSchedule();
        expect(Object.values(schedule.days).reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(
            3
        );

        schedule.preview('cs21105', 0);
        schedule._computeSchedule();
        schedule.removePreview();

        // preview an already present one
        schedule.preview('cs21504', 0);
        schedule._computeSchedule();
        schedule.removePreview();

        for (const i of [0, 1, 2, 3, 4, 5]) schedule.update('chem14105', i);
        for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) schedule.update('chem14114', i);
        Schedule.options.combineSections = false;
        schedule._computeSchedule();
        expect(Object.values(schedule.days).reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(
            3
        );

        schedule.hover('cs21105', true);
        schedule.hover('cs21504', true);
        for (const day in schedule.days) {
            const blocks = schedule.days[day];
            for (const block of blocks) {
                if (block.section instanceof Section) {
                    if (block.section.key === 'cs21105') {
                        expect(block.strong).toBe(true);
                    }
                    if (block.section.key === 'cs21504') {
                        expect(block.strong).toBe(true);
                    }
                }
            }
        }

        schedule.copy();
        schedule.toJSON();
        schedule.clean();
    });
});
