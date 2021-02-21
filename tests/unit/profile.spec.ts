import Store from '@/store';
const s = new Store();
let flag = true;
beforeAll(() => {
    window.confirm = () => flag;
});
test('profile basic', async () => {
    await s.semester.loadSemesters();
    s.profile.initProfiles(s.semester.semesters);

    // name of the latest semester
    const latest = s.semester.semesters[0].name;
    s.profile.addProfile({ name: 'prof1' });
    expect(s.profile.profiles.map(p => p.name)).toEqual([latest, 'prof1']);
    s.profile.deleteProfile(latest, 0);

    s.profile.addProfile({ name: 'prof2' });
    expect(s.profile.current).toBe('prof2');
    expect(s.profile.profiles.map(p => p.name)).toEqual(['prof1', 'prof2']);
    s.profile.addProfile({ name: 'prof2' });
    s.profile.addProfile({ wtf: 'prof2' } as any, 'prof1');
    expect(s.profile.current).toBe('prof1');

    s.profile.addProfile({ name: 'prof2' });
    s.profile.addProfile({ name: 'prof3' });

    s.profile.renameProfile(1, 'prof2', 'prof4', JSON.stringify({ name: 'prof2' }));
    expect(s.profile.profiles.map(p => p.name)).toEqual(['prof1', 'prof4', 'prof3']);

    s.profile.deleteProfile('prof1', 0);
    expect(s.profile.profiles.map(p => p.name)).toEqual(['prof4', 'prof3']);
    expect(s.profile.current).toBe('prof3');
    s.profile.deleteProfile('prof3', 1);
    expect(s.profile.current).toBe('prof4');

    // duplicated name
    flag = false;
    s.profile.addProfile({ name: 'prof4' }, 'prof4');
    expect(s.profile.current).toBe('prof4 (2)');
    s.profile.addProfile({ name: 'prof4' }, 'prof4');
    expect(s.profile.current).toBe('prof4 (3)');
});
