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
    });

    it('ScheduleGenerator', () => {
        const generator = new ScheduleGenerator(allRecords);
        expect(typeof generator.createSchedule).toBe('function');
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
        const result = generator.getSchedules(schedule);
        // console.log(result.schedules[1].schedule);
        //There is problem that
        /**   
             *  [ [ 'cs33304', [ 'We' ], [ 750, 825 ], 0 ],
                [ 'cs33305', [ 'Tu', 'Th' ], [ 750, 825 ], 1 ],
                [ 'ece23305', [ 'Mo', 'We', 'Fr' ], [ 660, 710 ], 0 ],
                [ 'ece23308', [ 'Mo' ], [ 930, 1005 ], 0 ],
                [ 'cs41025', [ 'Tu', 'Th' ], [ 840, 915 ], 0 ],
                [ 'cs47745', [ 'Tu', 'Th' ], [ 930, 1005 ], 0 ],
                [ 'apma31105', [ 'Mo', 'We', 'Fr' ], [ 840, 890 ], 3 ],
                [ 'phys24194', [ 'Tu' ], [ 720, 830 ], 3 ],
                [ 'ece26308', [ 'Mo', 'We', 'Fr' ], [ 540, 650 ], 0 ] ] 
            gives wrong data: cs33305 and cs47745 should switch position
                */
        // for (const i of result.schedules.schedule[0]) {
        //     console.log(i);
        // }
    });
});
