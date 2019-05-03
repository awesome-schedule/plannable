import 'jest';
import Schedule from '../../src/models/Schedule';
import * as Utils from '../../src/utils';
import data from './data';
describe('Schedule Test', () => {
    it('Schedule Static Field Test', () => {
        expect(Schedule.fields).toEqual(['All', 'title', 'id']);
    });

    it('Schedule Color Hash', async () => {
        const len = Schedule.bgColors.length;
        const frequencies = new Float32Array(len);
        const { raw_data } = await data;
        for (const key in raw_data) {
            const hash = Utils.hashCode(key) % len;
            frequencies[hash] += 1;
        }
        const sum = frequencies.reduce((acc, x) => acc + x, 0);
        const prob = frequencies.map(x => (x * 100) / sum);
        console.log(prob);
        // we expect the hashes to be quite uniformly distributed
        expect(prob.some(x => x > 11)).toBe(false);
    });

    it('From Json', () => {
        expect(1).toBe(1);
    });
});
