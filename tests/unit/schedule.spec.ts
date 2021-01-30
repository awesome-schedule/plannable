import Schedule from '@/models/Schedule';
import Section from '@/models/Section';
import * as Utils from '@/utils';
import colorSchemes from '@/data/ColorSchemes';
import ProposedSchedule from '@/models/ProposedSchedule';
import GeneratedSchedule from '@/models/GeneratedSchedule';

describe('Schedule Test', () => {
    it('Schedule Color Hash', () => {
        const colors = colorSchemes[0].colors;
        const len = colors.length;
        const frequencies = new Float32Array(len);
        const courseDict = window.catalog.courseDict;
        for (const key in courseDict) {
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
        const schedule = ProposedSchedule.fromJSON(parsed).payload!;
        expect(schedule).toBeTruthy();
        expect(schedule.All).toEqual(
            global.convertAll({
                cs21505: new Set([0]),
                cs21504: new Set([1]),
                cs11105: -1
            })
        );

        expect(ProposedSchedule.fromJSON().payload).toBeFalsy();
        expect(
            ProposedSchedule.fromJSON({
                All: {},
                events: []
            }).payload!.empty()
        ).toBe(true);
    });

    // todo
    it('From Json new', () => {
        // plannable v7 format
        let json = `
        {"All":{"cs21025":-1,"cs21105":[{"id":15486,"section":"001"}]},"id":0,"title":"Schedule","events":[]}`;
        let parsed = JSON.parse(json);
        let schedule = ProposedSchedule.fromJSON(parsed).payload!;
        expect(schedule).toBeTruthy();
        expect(schedule.empty()).toBeFalsy();

        // plannable v7-8 mixed format
        // test for invalid section, invalid key
        json = `
        {"All":{"cs21025":[],"cs21105":[[{"id":15486,"section":"001"}]],
        "cs213123123": [1], "cs11105": [999],
        "cs21505": [{"id": "asd", "section": "invalid section"}]},"id":0,"title":"Schedule","events":[]}`;
        parsed = JSON.parse(json);
        schedule = ProposedSchedule.fromJSON(parsed).payload!;
    });

    it('add/update course/events', async () => {
        const schedule = new ProposedSchedule();
        const cs11105 = window.catalog.getCourse('cs11105');
        const id0 = cs11105.sections[1].id;
        expect(schedule.All).toEqual({});
        schedule.update('cs11105', id0);
        expect(schedule.All).toEqual({ cs11105: [new Set([id0])] });
        schedule.update('cs11105', id0);
        expect(schedule.All).toEqual({});
        schedule.update('cs11105', id0);
        schedule.update('cs11105', id0, 0, false);
        expect(schedule.All).toEqual({ cs11105: [] });

        const cs21105 = window.catalog.getCourse('cs21105');
        const cs21504 = window.catalog.getCourse('cs21504');
        schedule.update('cs21105', -1);
        schedule.update('cs21504', cs21504.ids[0]);
        schedule.update('cs21504', cs21504.ids[1]);
        schedule.update('cs21504', cs21504.ids[2]);
        schedule.update('cs21505', -1);
        schedule.update('cs11105', cs11105.ids[0]);
        schedule.addEvent('MoTu 12:00AM - 3:00AM', true, 'title1');
        await schedule.computeSchedule();
        expect(schedule.days.reduce((acc, x) => acc + x.length, 0)).toBeGreaterThan(3);
        try {
            schedule.addEvent('MoTu 12:15AM - 2:00AM', true);
        } catch (err) {
            expect(err.message).toBe(`Your new event conflicts with title1`);
        }

        schedule.preview(cs21105.sections[0]);
        schedule.computeSchedule();
        schedule.removePreview();

        expect(schedule.equals(schedule)).toBe(true);
        expect(schedule.equals(schedule.copy())).toBe(true);

        // preview an already present one
        schedule.preview(cs21504.sections[0]);
        schedule.computeSchedule();
        schedule.removePreview();

        const chem14105 = window.catalog.getCourse('chem14105');
        for (const i of chem14105.ids) schedule.update('chem14105', i);
        for (const i of window.catalog.getCourse('chem14114').ids) schedule.update('chem14114', i);
        Schedule.combineSections = false;
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

        Schedule.multiSelect = false;
        schedule.computeSchedule();

        schedule.update('cs21105', -1);
        expect(schedule.All).not.toHaveProperty('cs21105');
        schedule.update('cs21105', -1);
        schedule.update('cs21105', -1, 0, false);
        expect(schedule.All).toHaveProperty('cs21105');
        expect(schedule.All.cs21105).toBeInstanceOf(Array);
        expect(schedule.has('cs21105', false)).toBe(true);
        expect(schedule.has('cs21105', true)).toBe(false);

        schedule.toJSON();
        schedule.deleteEvent('MoTu 12:00AM - 3:00AM');
        schedule.remove('cs21105');
        schedule.clean();

        // dummy test
        schedule['randEvents']();
    });

    it('Generated schedules', () => {
        const schedule = new GeneratedSchedule();
        try {
            schedule.update();
        } catch (e) {
            expect(e).toBeInstanceOf(Utils.GeneratedError);
        }
        try {
            schedule.remove();
        } catch (e) {
            expect(e).toBeInstanceOf(Utils.GeneratedError);
        }

        const copied = schedule.copy();
        expect(copied).toBeInstanceOf(ProposedSchedule);
        expect(copied.equals(schedule)).toBe(true);
        const course = window.catalog.search('cs2102')[0][0];
        copied.update(course.key, course.sections[0].id, 1);
        expect(copied.equals(schedule)).toBe(false);
    });
});
