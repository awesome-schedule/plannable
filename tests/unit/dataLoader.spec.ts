import { loadBuildingList, loadTimeMatrix } from '@/data/BuildingLoader';
import { fallback, loadFromCache } from '@/data/Loader';
import { loadSemesterList } from '@/data/SemesterListLoader';

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

        await loadTimeMatrix();

        await loadTimeMatrix(true);
    });

    it('building list', async () => {
        let data = await loadBuildingList();
        let payload = data.payload!;
        expect(payload).toBeTruthy();
        expect(typeof payload[0]).toBe('string');

        data = await loadBuildingList();
        payload = data.payload!;
        expect(payload).toBeTruthy();
        expect(typeof payload[0]).toBe('string');

        await loadBuildingList(true);
    });

    it('semester data', async () => {
        const data = await loadSemesterList(5);
        const payload = data.payload!;
        expect(payload).toBeTruthy();
        expect(payload[0].id).toBeTruthy();
    });

    it('test', async () => {
        const payload = await fallback(
            loadFromCache<string, { modified: string; str: string }>(
                'dummy',
                async () => {
                    throw new Error('dummy error');
                },
                x => x.str,
                {}
            )
        );
        expect(payload.level).toBe('error');
        expect(payload.msg).toBe('dummy error');
    });
});
