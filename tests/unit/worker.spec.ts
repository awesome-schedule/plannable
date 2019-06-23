import '../../src/workers/SearchWorker';

describe('worker', () => {
    it('test', async () => {
        global.msgHandler({
            data: window.catalog.courseDict
        });

        expect(global.queue.pop()).toBe('ready');

        global.msgHandler({ data: 'computer vision' });

        expect(global.queue.pop()).toBeInstanceOf(Array);

        global.msgHandler({ data: 'culture and society' });

        expect(global.queue.pop()).toBeInstanceOf(Array);

        global.msgHandler({ data: 'boomf' });

        expect(global.queue.pop()).toBeInstanceOf(Array);

        global.msgHandler({ data: 'Vicente Ordonez-Roman' });

        expect(global.queue.pop()).toBeInstanceOf(Array);

        try {
            await window.catalog.fuzzySearch('asd');
        } catch (err) {
            expect(err).toBe('Worker not initialized!');
        }
    });
});
