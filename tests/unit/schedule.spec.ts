import Schedule from '@/models/Schedule';
import Section from '@/models/Section';
import * as Utils from '@/utils';

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
        // we expect the hashes to be quite uniformly distributed
        expect(prob.some(x => x > 11)).toBe(false);
    });

    // backward compatibility test
    it('From Json old', () => {
        const json = `{"All":{"cs21505":[0],"cs21504":[1], "cs11105": -1},
        "id":1,"title":"Schedule","events":[],"savedColors":{"cs21505":"#af2007","cs21504":"#068239"}}`;
        const parsed = JSON.parse(json);
        const schedule = Schedule.fromJSON(parsed).payload!;
        expect(schedule).toBeTruthy();
        expect(schedule.All).toEqual({
            cs21505: new Set([0]),
            cs21504: new Set([1]),
            cs11105: -1
        });

        expect(schedule.fromJSON().payload).toBeFalsy();
        expect(
            schedule
                .fromJSON({
                    All: {},
                    events: []
                })
                .payload!.empty()
        ).toBe(true);
    });

    // todo
    it('From Json new', () => {
        let json = `
        {"All":{"cs21025":-1,"cs21105":[{"id":15486,"section":"001"}]},"id":0,"title":"Schedule","events":[]}`;
        let parsed = JSON.parse(json);
        let schedule = Schedule.fromJSON(parsed).payload!;
        expect(schedule).toBeTruthy();
        expect(schedule.empty()).toBeFalsy();

        // test for invalid section, invalid key
        json = `
        {"All":{"cs21025":[],"cs21105":[{"id":15486,"section":"001"}],
        "cs213123123": [1], "cs11105": [999],
        "cs21505": [{"id": "asd", "section": "invalid section"}]},"id":0,"title":"Schedule","events":[]}`;
        parsed = JSON.parse(json);
        schedule = Schedule.fromJSON(parsed).payload!;
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
        expect(schedule.days.reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(3);
        try {
            schedule.addEvent('MoTu 12:15AM - 2:00AM', true);
        } catch (err) {
            expect(err.message).toBe(`Your new event conflicts with title1`);
        }

        expect(schedule.has('MoTu 12:00AM - 3:00AM')).toBe(true);

        schedule.preview(window.catalog.getCourse('cs21105').sections[0]);
        schedule.computeSchedule();
        schedule.removePreview();

        expect(schedule.equals(schedule)).toBe(true);
        expect(schedule.equals(schedule.copy())).toBe(true);

        // preview an already present one
        schedule.preview(window.catalog.getCourse('cs21504').sections[0]);
        schedule.computeSchedule();
        schedule.removePreview();

        for (const i of [0, 1, 2, 3, 4, 5]) schedule.update('chem14105', i);
        for (const i of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) schedule.update('chem14114', i);
        Schedule.options.combineSections = false;
        schedule.computeSchedule();
        schedule.computeSchedule(false);
        expect(Object.values(schedule.days).reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(
            3
        );

        schedule.hover('cs21105', true);
        schedule.hover('cs21504', true);
        for (const blocks of schedule.days) {
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

        Schedule.options.multiSelect = false;
        schedule.computeSchedule();

        schedule.update('cs21105', -1);
        expect(schedule.All).not.toHaveProperty('cs21105');
        schedule.update('cs21105', -1);
        schedule.update('cs21105', -1, false);
        expect(schedule.All).toHaveProperty('cs21105');
        expect(schedule.All.cs21105).toBeInstanceOf(Set);
        expect((schedule.All.cs21105 as Set<number>).size).toBe(0);
        expect(schedule.has('cs21105', false)).toBe(true);
        expect(schedule.has('cs21105', true)).toBe(false);

        schedule.toJSON();
        schedule.deleteEvent('MoTu 12:00AM - 3:00AM');
        schedule.remove('cs21105');
        schedule.clean();
    });
});
