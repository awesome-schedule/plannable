import Schedule from '../../src/models/Schedule';
import Section from '../../src/models/Section';
import display from '../../src/store/display';
import * as Utils from '../../src/utils';
import data from './data';

beforeAll(async () => {
    window.catalog = await data;
});

describe('Schedule Test', () => {
    it('Schedule Color Hash', () => {
        const len = Schedule.bgColors.length;
        const frequencies = new Float32Array(len);
        const raw_data = window.catalog.raw_data;
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

        schedule.setColor('cs11105', '#ffffff');
        schedule.setColor('cs11105', '#CC9393');
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

        expect(schedule.fromJSON()).toBeFalsy();
        expect(
            schedule
                .fromJSON({
                    All: {},
                    title: '',
                    id: 0,
                    events: []
                })!
                .empty()
        ).toBe(true);
    });

    // backward compatibility test
    it('From Json old', () => {
        const json = `{"All":{"cs2150lecture":[0],"cs2150laboratory":[1], "cs1110lecture": -1},
        "id":1,"title":"Schedule","events":[]}`;
        const parsed = JSON.parse(json);
        let schedule = Schedule.fromJSON(parsed)!;
        schedule = schedule.fromJSON(parsed)!;
        expect(schedule).toBeTruthy();
        expect(schedule.empty()).toBeFalsy();
        expect(schedule.has('cs21505')).toBeTruthy();
        expect(schedule.All).toEqual({
            cs21505: new Set([0]),
            cs21504: new Set([1]),
            cs11105: -1
        });
    });

    it('add/update course/events', () => {
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
        schedule.addEvent('MoTu 12:00AM - 3:00AM', true, 'title1');
        schedule.computeSchedule();
        expect(Object.values(schedule.days).reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(
            3
        );
        try {
            schedule.addEvent('MoTu 12:15AM - 2:00AM', true);
        } catch (err) {
            expect(err.message).toBe(`Your new event conflicts with title1`);
        }

        expect(schedule.has('MoTu 12:00AM - 3:00AM')).toBe(true);

        schedule.preview('cs21105', 0);
        schedule.computeSchedule();
        schedule.removePreview();

        // preview an already present one
        schedule.preview('cs21504', 0);
        schedule.computeSchedule();
        schedule.removePreview();

        for (const i of [0, 1, 2, 3, 4, 5]) schedule.update('chem14105', i);
        for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) schedule.update('chem14114', i);
        display.combineSections = false;
        schedule.computeSchedule();
        schedule.computeSchedule(false);
        schedule.computeConflict();
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

        schedule.unhover('cs21105');
        schedule.unhover('cs21504');

        display.multiSelect = false;
        schedule.computeSchedule();

        schedule.update('cs21105', -1);
        expect(schedule.All).not.toHaveProperty('cs21105');
        schedule.update('cs21105', -1);
        schedule.update('cs21105', -1, false);
        expect(schedule.All).toHaveProperty('cs21105');
        expect(schedule.All.cs21105).toBeInstanceOf(Set);
        expect((schedule.All.cs21105 as Set<number>).size).toBe(0);

        schedule.copy();
        schedule.toJSON();
        schedule.deleteEvent('MoTu 12:00AM - 3:00AM');
        schedule.remove('cs21105');
        schedule.clean();
    });
});
