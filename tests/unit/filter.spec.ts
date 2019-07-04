import filter from '@/store/filter';

it('filter', () => {
    filter.timeSlots.length = 0;
    const { level } = filter.computeFilter();
    expect(level).toBe('success');
});

it('json', () => {
    const str1 = JSON.stringify(filter.toJSON());
    filter.fromJSON(JSON.parse(str1));
    const str2 = JSON.stringify(filter.toJSON());
    expect(str1).toEqual(str2);
});
