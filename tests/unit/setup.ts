import { requestBuildingList, requestTimeMatrix } from '@/data/BuildingLoader';
import { requestSemesterData } from '@/data/CatalogLoader';
import CatalogDB from '@/database/CatalogDB';
import Catalog from '@/models/Catalog';
import { ScheduleAll } from '@/models/Schedule';

global.console.time = jest.fn();
global.console.timeEnd = jest.fn();
global.console.log = jest.fn();

jest.mock('dexie', () => {
    const p = new Proxy(
        {},
        {
            get(a, key) {
                // return 0 for count which signals an empty db
                if (key === 'count') return () => Promise.resolve(0);
                return () => {};
            }
        }
    );
    return class Dexie {
        version() {
            return p;
        }
        table(name: string) {
            if (name === 'meta') {
                return {
                    // return last day so it seems expired
                    get() {
                        return Promise.resolve(Date.now() - 86400 * 1000 * 10);
                    },
                    put() {
                        return Promise.resolve();
                    }
                };
            }
            return p;
        }
    };
});

// set async time out to 50 seconds
// God knows why sometimes request takes so long
jest.setTimeout(50000);

function convertAll(all: ScheduleAll) {
    const converted: ScheduleAll = {};
    for (const key in all) {
        const val = all[key];
        if (val instanceof Set) {
            const a = new Set<number>();
            for (const idx of val) {
                a.add(window.catalog.getSection(key, idx).id);
            }
            converted[key] = a;
        } else {
            converted[key] = val;
        }
    }
    return converted;
}

Object.defineProperty(global, 'onmessage', {
    set(handler) {
        global.msgHandler = handler;
    },
    get() {
        return global.msgHandler;
    }
});
declare global {
    namespace NodeJS {
        interface Global {
            queue: any[];
            postMessage: (msg: any) => void;
            convertAll: typeof convertAll;
            msgHandler(msg: any): void;
        }
    }
}

global.queue = [];
global.convertAll = convertAll;
global.postMessage = msg => global.queue.push(msg);

beforeAll(async () => {
    const catalog = await requestSemesterData(
        { name: '', id: '1198' },
        new CatalogDB({ name: '', id: '' })
    );
    // catalog.raw_data.cs45015[6].push([
    //     19281,
    //     '001',
    //     'testtesttest',
    //     2,
    //     93,
    //     91,
    //     52,
    //     '08/27/2019 - 12/06/2019',
    //     0,
    //     [['Comp. Vision', 'MoWe 5:00PM - 6:15PM', 'Thornton Hall E316']]
    // ]);
    window.catalog = new Catalog(catalog.semester, catalog.courseDict, catalog.modified);
    window.timeMatrix = await requestTimeMatrix();
    window.buildingList = await requestBuildingList();
});
