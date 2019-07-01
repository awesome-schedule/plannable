import Catalog from '@/models/Catalog';
import { requestSemesterData } from '@/data/CatalogLoader';
import { requestTimeMatrix } from '@/data/BuildingLoader';

global.console.time = jest.fn();
global.console.timeEnd = jest.fn();
global.console.log = jest.fn();

// set async time out to 50 seconds
// God knows why sometimes request takes so long
jest.setTimeout(50000);

Object.defineProperty(global, 'onmessage', {
    set(handler) {
        global.msgHandler = handler;
    },
    get() {
        return global.msgHandler;
    }
});
global.queue = [];
global.postMessage = msg => global.queue.push(msg);

beforeAll(async () => {
    const catalog = await requestSemesterData({ name: '', id: '1198' });
    catalog.raw_data.cs45015[6].push([
        19281,
        '001',
        'testtesttest',
        2,
        93,
        91,
        52,
        [['Comp. Vision', 'MoWe 5:00PM - 6:15PM', 'Thornton Hall E316', '08/27/2019 - 12/06/2019']]
    ]);
    window.catalog = new Catalog(catalog.semester, catalog.raw_data, catalog.modified);
    window.timeMatrix = await requestTimeMatrix();
});
