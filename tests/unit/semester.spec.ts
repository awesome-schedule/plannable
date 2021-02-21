import Store from '@/store';
import semester from '@/store/semester';

const flag = false;
beforeAll(() => {
    window.confirm = () => flag;
});

test('semester', async () => {
    const r = await semester.loadSemesters();
    expect(r.level).toBe('success');

    const r2 = await semester.selectSemester({ id: '1198', name: '' });
    expect(r2.level).toBe('success');

    const r3 = await semester.selectSemester({ id: '23333333', name: '' });
    expect(r3.level).toBe('error');
});

test('switching', async () => {
    const store = new Store();
    expect(store.profile.profiles.find(p => p.name === 'Fall 2019')).toBeFalsy();
    await store.selectSemester(store.semester.semesters.find(s => s.name.startsWith('Fall 2019'))!);
    expect(store.profile.profiles.find(p => p.name === 'Fall 2019')).toBeTruthy(); // new profile created for the target semester

    // edge case
    await store.profile.addProfile({
        name: 'Fall 2020',
        currentSemester: store.semester.semesters.find(s => s.name.startsWith('Fall 2019'))
    });
    await store.selectSemester(store.semester.semesters.find(s => s.name.startsWith('Fall 2020'))!);
    expect(store.profile.profiles.find(p => p.name === 'Fall 2020 (2)')).toBeTruthy();
});
