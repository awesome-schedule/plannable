import Store from '@/store';
const s = new Store();
let flag = true;
beforeAll(() => {
    window.confirm = () => flag;
});
test('profile basic', async () => {
    await s.semester.loadSemesters();
    s.profile.initProfiles(s.semester.semesters);

    s.profile.addProfile(JSON.stringify({ name: 'prof1' }), '');
    expect(s.profile.profiles).toEqual(['Spring 2020', 'prof1']);
    s.profile.deleteProfile('Spring 2020', 0);

    s.profile.addProfile(JSON.stringify({ name: 'prof2' }), '');
    expect(s.profile.current).toBe('prof2');
    expect(s.profile.profiles).toEqual(['prof1', 'prof2']);
    s.profile.addProfile(JSON.stringify({ name: 'prof2' }), '');
    s.profile.addProfile(JSON.stringify({ wtf: 'prof2' }), 'prof1');
    expect(s.profile.current).toBe('prof1');

    s.profile.addProfile(JSON.stringify({ name: 'prof2' }), '');
    s.profile.addProfile(JSON.stringify({ name: 'prof3' }), '');

    s.profile.renameProfile(1, 'prof2', 'prof4', JSON.stringify({ name: 'prof2' }));
    expect(s.profile.profiles).toEqual(['prof1', 'prof4', 'prof3']);

    s.profile.deleteProfile('prof1', 0);
    expect(s.profile.profiles).toEqual(['prof4', 'prof3']);
    expect(s.profile.current).toBe('prof3');
    s.profile.deleteProfile('prof3', 1);
    expect(s.profile.current).toBe('prof4');

    // duplicated name
    flag = false;
    s.profile.addProfile(JSON.stringify({ name: 'prof4' }), 'prof4');
    expect(s.profile.current).toBe('prof4 (2)');
    s.profile.addProfile(JSON.stringify({ name: 'prof4' }), 'prof4');
    expect(s.profile.current).toBe('prof4 (3)');
});
