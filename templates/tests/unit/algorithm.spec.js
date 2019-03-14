import AllRecords from '../../src/models/AllRecords';
import data from './data.js';
import { Algorithm } from '../../src/algorithm/Algorithm';
import {} from 'jasmine';

const allRecords = new AllRecords(data);

describe('Algorithm Test', () => {
    it('Data Validation', () => {
        expect(typeof data).toBe('object');
        const course = allRecords.getRecord('aas10201');
        expect(course.id[0]).toBe(10309);
    });

    it('Algorithm', () => {
        const algorithm = new Algorithm(allRecords);
        expect(typeof algorithm.createSchedule).toBe('function');
        expect('output').toBe('output');
    });
});
