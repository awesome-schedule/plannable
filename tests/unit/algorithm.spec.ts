import Catalog from '../../src/models/Catalog';
import data from './data';
import ScheduleGenerator from '../../src/algorithm/ScheduleGenerator';
import Schedule from '../../src/models/Schedule';
import 'jest';

describe('ScheduleGenerator Test', () => {
    it('Data Validation', async () => {
        const allRecords = new Catalog({ id: '1198', name: 'Fall 2019' }, await data);
        expect(typeof data).toBe('object');
        const course = allRecords.getCourse('cs11105');
        expect(typeof course.sections[0].id).toBe('number');
    });

    it('ScheduleGenerator', async () => {
        const allRecords = new Catalog({ id: '1198', name: 'Fall 2019' }, await data);
        const generator = new ScheduleGenerator(allRecords);
        expect(typeof generator.createSchedule).toBe('function');
        const schedule = new Schedule();
        schedule.All = {
            cs33304: -1,
            cs33305: -1,
            ece23305: -1,
            ece23308: new Set([0]),
            cs41025: -1,
            cs47745: -1,
            apma31105: -1,
            phys24194: new Set([0]),
            ece26308: -1
        };
        const result = generator.getSchedules(schedule);
        expect(result.empty()).toBeFalsy();
    });
});
