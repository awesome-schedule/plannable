import filter from '@/store/filter';

it('filter', () => {
    filter.timeSlots.length = 0;
    const { level } = filter.computeFilter();
    expect(level).toBe('success');

    filter.timeSlots.push([false, false, false, false, false, '00:00', '10:00']);
    const { level: level2 } = filter.computeFilter();
    expect(level2).toBe('error');

    filter.timeSlots.push([false, false, true, false, false, '00:00', '']);
    const { msg } = filter.computeFilter();
    expect(msg).toBe('Invalid time input! Please check your filters.');
});

it('json', () => {
    const str1 = JSON.stringify(filter.toJSON());
    filter.fromJSON(JSON.parse(str1));
    const str2 = JSON.stringify(filter.toJSON());
    expect(str1).toEqual(str2);
});
