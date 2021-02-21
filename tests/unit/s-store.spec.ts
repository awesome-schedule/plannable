/* eslint-disable @typescript-eslint/no-var-requires */
import Store from '@/store';
import profile from '@/store/profile';
const store = new Store();
const { schedule } = store;

beforeAll(() => {
    window.confirm = () => true;
});

test('schedule basic', () => {
    schedule.clear();
    schedule.newProposed();
    expect(schedule.proposedSchedules.length).toBe(2);
    expect(schedule.proposedScheduleIndex).toBe(1);
    schedule.switchProposed(0);
    expect(schedule.proposedScheduleIndex).toBe(0);
    schedule.copyCurrent();
    expect(schedule.proposedScheduleIndex).toBe(2);
    schedule.switchSchedule(false);
    expect(schedule.currentSchedule).toBe(schedule.proposedSchedule);

    schedule.deleteProposed();
    expect(schedule.proposedScheduleIndex).toBe(1);
    schedule.copyCurrent();
    schedule.switchProposed(1);
    schedule.deleteProposed();
    expect(schedule.proposedScheduleIndex).toBe(1);
    schedule.fromJSON(schedule.toJSON());

    schedule.fromJSON({});
    expect(schedule).toEqual(schedule.getDefault());
});

test('generated', () => {
    schedule.clear();
    schedule.switchPage(0);

    schedule.newProposed();
    expect(schedule.proposedSchedules.length).toBe(2);
    schedule.currentSchedule.update('cs21105', -1);
    store.generateSchedules();
    expect(schedule.cpIndex).toBe(1);
    schedule.recomputeAll(true);

    schedule.copyCurrent();
    schedule.switchPage(-1);
    schedule.switchPage(10000);
    schedule.deleteProposed();
    schedule.deleteProposed();
    expect(schedule.cpIndex).toBe(-1);

    schedule.currentSchedule.update('cs21105', -1);
    store.generateSchedules();
    expect(schedule.cpIndex).toBe(0);
    schedule.clear();
    expect(schedule.currentSchedule.empty()).toBe(true);
});

test('semesters and profile switching', async () => {
    const sem = store.semester.semesters.find(s => s.name === 'Fall 2019')!;
    const json = require('./test_data/mySchedule2019Fall.json');
    await store.profile.addProfile(json, '');
    expect(profile.current).toBe('mySchedule2019Fall');
    await store.loadProfile();
    expect(profile.current).toBe('mySchedule2019Fall');

    expect(store.semester.current!.name).toBe('Fall 2019');
    await store.selectSemester(store.semester.semesters[0]);
    expect(store.semester.current!.name).not.toBe('Fall 2019');
    await store.selectSemester(sem);
    expect(profile.current).toBe('mySchedule2019Fall');
});
