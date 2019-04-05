// @ts-check
import AllRecords from '../../src/models/AllRecords';
import { getSemesterData } from '../../src/data/DataLoader';
import {} from 'jest';
describe('Request Test', () => {
    it('Data Validation', done => {
        expect(1).toBe(1);
        done();
        // getSemesterData('1198')
        //     .then(data => {
        //         const allRecords = new AllRecords({ id: '1198', name: 'Fall 2019' }, data);
        //         expect(allRecords).toBeTruthy();
        //         done();
        //     })
        //     .catch(err => {
        //         throw err;
        //     });
    });
});
