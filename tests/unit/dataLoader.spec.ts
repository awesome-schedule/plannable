import 'jest';
import { loadTimeMatrix } from '../../src/data/BuildingLoader';
describe('Data loader test', () => {
    it('Time matrix symmetry', async () => {
        const msg = await loadTimeMatrix();
        const data = msg.payload;
        expect(data).toBeInstanceOf(Int32Array);
        if (data) {
            const len = data.length ** 0.5;
            expect(len).toBe(Math.floor(len));
            for (let i = 0; i < len; i++) {
                for (let j = 0; j < len; j++) {
                    expect(data[i * len + j]).toBe(data[j * len + i]);
                }
            }
        }
    });
});
