import 'jest';
import * as DataLoader from '../../src/data/DataLoader';
describe('Data loader test', () => {
    it('Time matrix symmetry', async () => {
        const data = await DataLoader.fetchTimeMatrix();
        const len = data.length ** 0.5;
        expect(len).toBe(Math.floor(len));
        for (let i = 0; i < len; i++) {
            for (let j = 0; j < len; j++) {
                expect(data[i * len + j]).toBe(data[j * len + i]);
            }
        }
    });
});
