// @ts-check
import AllRecords from '../../src/models/AllRecords';
import getSemesterData from '../../src/data/SemesterLoader';
import {} from 'jest';
describe('Request Test', () => {
    it('Data Validation', done => {
        getSemesterData('1198', data => {
            const allRecords = new AllRecords({ id: '1198', name: 'Fall 2019' }, data);
            expect(allRecords).toBeTruthy();
            done();
        });
    });
});
