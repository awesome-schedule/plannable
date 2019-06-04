import ScheduleGenerator from '@/algorithm/ScheduleGenerator';
import { loadBuildingList, loadTimeMatrix } from '@/data/BuildingLoader';
import Schedule from '@/models/Schedule';
import Store from '@/store';
import data from './data';

const store = new Store();

beforeAll(async () => {
    window.timeMatrix = (await loadTimeMatrix()).payload!;
    window.buildingList = (await loadBuildingList()).payload!;
});

describe('ScheduleGenerator Test', () => {
    it('Data Validation', () => {
        const allRecords = window.catalog;
        expect(typeof data).toBe('object');
        const course = allRecords.getCourse('cs11105');
        expect(typeof course.sections[0].id).toBe('number');
    });

    it('ScheduleGenerator', () => {
        const catalog = window.catalog;
        const buildingList = window.buildingList;
        store.filter.timeSlots.push([true, false, true, false, true, '0:15', '0:50']);
        const options = store.getGeneratorOptions();
        if (!options) throw new Error('failed to get options');

        const generator = new ScheduleGenerator(catalog, buildingList, options);
        expect(typeof generator.createSchedule).toBe('function');
        const schedule = new Schedule();
        schedule.All = {
            cs11105: -1,
            cs11104: -1,
            ece23305: -1,
            ece23308: new Set([0]),
            cs41025: -1,
            apma31105: -1,
            phys24194: -1,
            kine11005: -1
        };
        let sort = options.sortOptions;
        sort.sortBy[0].enabled = true;
        sort.sortBy[1].enabled = true;
        sort.sortBy[2].enabled = true;
        sort.sortBy[2].reverse = true;
        sort.sortBy[3].enabled = true;
        sort.sortBy[4].enabled = true;
        const { payload: result } = generator.getSchedules(schedule);
        expect(result!.empty()).toBeFalsy();

        schedule.addEvent('MoFr 10:00AM - 10:15AM', false);
        schedule.addEvent('MoFr 21:00PM - 22:30PM', false);

        sort.mode = 0;
        options.combineSections = false;
        const { payload: result2 } = generator.getSchedules(schedule);
        expect(result2!.empty()).toBeFalsy();

        sort.sortBy[5].enabled = true;
        const { payload: result3 } = generator.getSchedules(schedule);
        expect(result3!.empty()).toBeFalsy();

        sort = store.filter.getDefault().sortOptions;
        sort.sortBy[1].enabled = false;
        const result4 = generator.getSchedules(schedule).payload!;
        expect(result4.empty()).toBeFalsy();

        sort.mode = 0;
        result4.changeSort(sort, true);
        expect(result4.getSchedule(0)).toBeInstanceOf(Schedule);
        result4.clear();

        sort.mode = 1;
        // only one sort func
        for (const sb of sort.sortBy) {
            sb.enabled = false;
        }
        sort.sortBy[3].enabled = true;
        sort.sortBy[3].reverse = true;
        result4.changeSort(sort, true);
        result4.partialSort(result4.schedules, (a, b) => a.coeff - b.coeff, 10);

        sort.sortBy[3].enabled = true;
        sort.sortBy[3].reverse = true;
        result4.changeSort(sort, true);
    });
});
