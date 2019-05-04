import 'jest';
import { loadTimeMatrix, loadBuildingList } from '../../src/data/BuildingLoader';
import { loadSemesterList } from '../../src/data/SemesterListLoader';
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

    it('building list', async () => {
        const data = await loadBuildingList();
        const payload = data.payload!;
        expect(payload).toBeTruthy();
        expect(typeof payload[0]).toBe('string');
    });

    it('semester data', async () => {
        const data = await loadSemesterList(5);
        const payload = data.payload!;
        expect(payload).toBeTruthy();
        expect(payload[0].id).toBeTruthy();
    });
});
