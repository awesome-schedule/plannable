import semester from '@/store/semester';

test('semester', async () => {
    const r = await semester.loadSemesters();
    expect(r.level).toBe('success');

    const r2 = await semester.selectSemester({ id: '1198', name: '' });
    expect(r2.level).toBe('success');

    const r3 = await semester.selectSemester({ id: '23333333', name: '' });
    expect(r3.level).toBe('error');
});
