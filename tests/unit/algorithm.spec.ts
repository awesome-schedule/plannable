import ScheduleGenerator from '../../src/algorithm/ScheduleGenerator';
import { loadBuildingList, loadTimeMatrix } from '../../src/data/BuildingLoader';
import Schedule from '../../src/models/Schedule';
import Store from '../../src/store';
import data from './data';

const store = new Store();

beforeAll(async () => {
    window.catalog = await data;
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
        const options = store.getGeneratorOptions();
        if (!options) throw new Error('failed to get options');

        const generator = new ScheduleGenerator(catalog, buildingList, options);
        expect(typeof generator.createSchedule).toBe('function');
        const schedule = new Schedule();
        schedule.All = {
            cs33304: -1,
            cs33305: -1,
            ece23305: -1,
            ece23308: new Set([0]),
            cs41025: -1,
            apma31105: -1,
            phys24194: -1,
            ece26308: -1
        };
        let sort = options.sortOptions;
        sort.sortBy[0].enabled = true;
        sort.sortBy[1].enabled = true;
        sort.sortBy[2].enabled = true;
        sort.sortBy[3].enabled = true;
        sort.sortBy[4].enabled = true;
        const result = generator.getSchedules(schedule);
        expect(result.empty()).toBeFalsy();

        schedule.addEvent('MoFr 12:00PM - 12:30PM', false);

        sort.mode = 0;
        options.combineSections = false;
        const result2 = generator.getSchedules(schedule);
        expect(result2.empty()).toBeFalsy();

        sort.sortBy[5].enabled = true;
        const result3 = generator.getSchedules(schedule);
        expect(result3.empty()).toBeFalsy();

        sort = store.filter.getDefault().sortOptions;
        sort.sortBy[1].enabled = false;
        const result4 = generator.getSchedules(schedule);
        expect(result4.empty()).toBeFalsy();

        sort.mode = 0;
        result4.changeSort(sort, true);
        result4.clear();
    });
});
