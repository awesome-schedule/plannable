import AllRecords from '../../src/models/AllRecords';
import data from './data.js';
import { ScheduleGenerator } from '../../src/algorithm/ScheduleGenerator';
import Schedule from '../../src/models/Schedule';

const allRecords = new AllRecords(data);

describe('ScheduleGenerator Test', () => {
    it('Data Validation', () => {
        expect(typeof data).toBe('object');
        const course = allRecords.getRecord('aas10201');
        expect(course.id[0]).toBe(10309);
    });

    it('ScheduleGenerator', () => {
        const generator = new ScheduleGenerator(allRecords);
        expect(typeof generator.createSchedule).toBe('function');
        expect('output').toBe('output');
        const schedule = new Schedule();
        schedule.All = {
            cs21105: -1
        };
        generator.getSchedules(schedule);
    });
});
