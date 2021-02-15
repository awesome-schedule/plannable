import Schedule from '@/models/Schedule';
import Store from '@/store';
import ProposedSchedule from '@/models/ProposedSchedule';

const store = new Store();

describe('ScheduleGenerator Test', () => {
    // it('Searcher', () => {
    //     expect(compareTwoStrings('1', '1')).toBe(1);
    //     expect(compareTwoStrings('1', '0')).toBe(0);
    //     expect(compareTwoStrings('', '')).toBe(1);
    //     expect(compareTwoStrings('', '0')).toBe(0);
    //     expect(compareTwoStrings('12', '0')).toBe(0);
    // });
    it('ScheduleGenerator', () => {
        store.filter.addTimeSlot();
        store.filter.removeTimeSlot(0);
        store.filter.timeSlots.length = 0;
        store.filter.timeSlots.push([true, false, true, false, true, false, false, '0:15', '0:50']);
        const options = store.getGeneratorOptions();
        if (!options) throw new Error('failed to get options');

        const schedule = (store.schedule.proposedSchedules[
            store.schedule.proposedScheduleIndex
        ] = new ProposedSchedule(
            global.convertAll({
                cs11105: -1,
                cs11104: -1,
                ece23305: -1,
                ece23308: new Set([0]),
                cs41025: -1,
                apma31105: -1,
                phys24194: -1,
                kine11005: -1
            })
        ));
        let sort = options.sortOptions;
        sort.sortBy[0].enabled = true;
        sort.sortBy[1].enabled = true;
        sort.sortBy[2].enabled = true;
        sort.sortBy[2].reverse = true;
        sort.sortBy[3].enabled = true;
        sort.sortBy[4].enabled = true;
        const result = store.generateSchedules();
        expect(result!.empty()).toBeFalsy();

        schedule.addEvent('MoFr 10:00AM - 10:15AM', false);
        schedule.addEvent('MoFr 21:00PM - 22:30PM', false);

        sort.mode = 0;
        options.combineSections = false;
        const result2 = store.generateSchedules();
        expect(result2!.empty()).toBeFalsy();

        sort.sortBy[6].enabled = true;
        const result3 = store.generateSchedules();
        expect(result3!.empty()).toBeFalsy();

        sort = store.filter.getDefault().sortOptions;
        sort.sortBy[1].enabled = false;
        const temp = store.generateSchedules();
        expect(temp).toBeTruthy();
        const result4 = temp!;
        sort.mode = 0;
        result4.sort({ newOptions: sort });
        expect(result4.getSchedule(0)).toBeInstanceOf(Schedule);

        sort.mode = 1;
        // only one sort func
        for (const sb of sort.sortBy) sb.enabled = false;

        sort.sortBy[3].enabled = true;
        sort.sortBy[3].reverse = true;
        result4.sort({ newOptions: sort });

        sort.sortBy[3].enabled = true;
        sort.sortBy[3].reverse = true;
        result4.sort({ newOptions: sort });

        schedule.events.length = 0;
        schedule.addEvent('MoTuWeThFr 8:00AM - 8:00PM', false);

        let r = store.generateSchedules();
        expect(r).toBeTruthy(); // will still try to generate schedule even if there's conflict

        schedule.events.length = 0;
        // similarity
        store.filter.refSchedule = {
            cs11105: [new Set<number>().add(window.catalog.getCourse('cs11105').sections[0].id)]
        };
        expect(store.filter.similarityEnabled).toBe(true);
        expect(sort.sortBy[5].name).toBe('similarity');
        sort.sortBy[5].enabled = true;
        r = store.generateSchedules();
        expect(r).toBeTruthy();
    });
});
