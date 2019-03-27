import AllRecords from '../../src/models/AllRecords';
import data from './data.js';
import { ScheduleGenerator } from '../../src/algorithm/ScheduleGenerator';
import Schedule from '../../src/models/Schedule';

const allRecords = new AllRecords({ id: '1198', name: 'Fall 2019' }, data);

describe('ScheduleGenerator Test', () => {
    it('Data Validation', () => {
        expect(typeof data).toBe('object');
        const course = allRecords.getRecord('cs11105');
        expect(typeof course.id[0]).toBe('number');
        // console.log(course);
        // // expect(course.id[0]).toBe(10309);
    });

    it('ScheduleGenerator', () => {
        const generator = new ScheduleGenerator(allRecords);
        expect(typeof generator.createSchedule).toBe('function');
        expect('output').toBe('output');
        const schedule = new Schedule();
        schedule.All = {
            cs33304: -1,
            cs33305: -1,
            ece23305: -1,
            ece23308: [0],
            cs41025: -1,
            cs47745: -1,
            apma31105: -1,
            phys24194: [3],
            ece26308: -1
        };
        try {
            const result = generator.getSchedules(schedule);
            console.log(result.schedules[1].schedule);
            // for (const i of result.schedules.schedule[0]) {
            //     console.log(i);
            // }
        } catch (e) {
            console.log(e);
        }
    });
});
