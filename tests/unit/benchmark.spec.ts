import ScheduleGenerator from '@/algorithm/ScheduleGenerator';
import { loadBuildingSearcher, loadTimeMatrix } from '@/data/BuildingLoader';
import Schedule from '@/models/Schedule';
import Store from '@/store';

const store = new Store();
store.display.maxNumSchedules = 200000;

test('algorithm benchmark', () => {
    const catalog = window.catalog;
    store.filter.timeSlots.push([true, false, true, false, true, false, false, '0:15', '0:50']);
    const options = store.getGeneratorOptions();
    if (!options) throw new Error('failed to get options');

    const generator = new ScheduleGenerator(catalog, window.timeMatrix, options);
    const schedule = new Schedule({
        cs11105: -1,
        cs11104: -1,
        enwr15107: -1,
        econ20105: -1,
        econ20101: -1,
        chem14105: -1,
        chem14101: -1,
        cs21025: -1
    });
    // const sort = options.sortOptions;
    // sort.sortBy[0].enabled = true;
    // sort.sortBy[1].enabled = true;
    // sort.sortBy[2].enabled = true;
    // sort.sortBy[2].reverse = true;
    // sort.sortBy[3].enabled = true;
    // sort.sortBy[4].enabled = true;

    let total = 0;
    const num = 6;
    for (let i = 0; i < num; i++) {
        const start = new Date().getTime();
        const { payload: result } = generator.getSchedules(schedule, false);
        const time = (new Date().getTime() - start) / 1000;
        expect(result!.empty()).toBeFalsy();
        total += time;
        console.info('run', i + 1, time + 's');
    }
    console.info('Average', total / num + 's');
});
