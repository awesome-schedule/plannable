import Store from '@/store';
const { schedule } = new Store();

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
