/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/camelcase */
import { FastSearcher } from '@/algorithm/Searcher';
import { dataend } from '@/config';
import { setupTimeMatrix } from '@/data/BuildingLoader';
import Catalog from '@/models/Catalog';
import { ScheduleAll } from '@/models/Schedule';
import Section, { SectionFields } from '@/models/Section';
import Store, { saveStatus } from '@/store';
import WatchFactory from '@/store/watch';
import { parseDate } from '@/utils';

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
                return () => 0;
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
                    // return yesterday so it seems expired
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

function convertAll(all: { [x: string]: Set<number> | -1 }) {
    const converted: ScheduleAll = {};
    for (const key in all) {
        const val = all[key];
        if (val instanceof Set) {
            const a = new Set<number>();
            for (const idx of val) {
                a.add(window.catalog.getCourse(key).sections[idx].id);
            }
            converted[key] = [a];
        } else {
            converted[key] = val;
        }
    }
    return converted;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface Global {
            convertAll: typeof convertAll;
        }
    }
}

global.convertAll = convertAll;

beforeAll(async () => {
    const store = new Store();
    await store.semester.loadSemesters(15);
    window.NativeModule = await require('../../public/js/wasm_modules.js')();
    const catalog = await dataend.courses({ name: '', id: '1198' });
    const section = Object.create(Section.prototype, {
        course: {
            value: catalog.courseDict.cs45015, // back ref to course
            enumerable: true
        },
        key: {
            value: 'cs45015',
            enumerable: true
        },
        id: {
            value: 19281 * 10,
            enumerable: true
        },
        section: {
            value: '001',
            enumerable: true
        },
        topic: {
            value: 'testtesttest',
            enumerable: true
        },
        status: {
            value: 'Closed',
            enumerable: true
        },
        enrollment: {
            value: 93,
            enumerable: true
        },
        enrollment_limit: {
            value: 91,
            enumerable: true
        },
        wait_list: {
            value: 52,
            enumerable: true
        },
        valid: {
            value: 0,
            enumerable: true
        },
        meetings: {
            value: [{
                'days': 'MoWe 5:00PM - 6:15PM',
                'instructor':  'dummy',
                'room': 'Thornton Hall E316'
            }],
            enumerable: true
        },
        instructors: {
            value: 'Comp. Vision',
            enumerable: true
        },
        rooms: {
            value: 'Comp. Vision',
            enumerable: true
        },
        dates: {
            value: '08/27/2019 - 12/06/2019',
            enumerable: true
        },
        dateArray: {
            value: parseDate('08/27/2019 - 12/06/2019'),
            enumerable: true
        }
    } as {
        [x in keyof Required<SectionFields>]: TypedPropertyDescriptor<Section[x]>;
    });
    catalog.courseDict.cs45015.sections.push(section);
    window.saveStatus = saveStatus;
    window.catalog = new Catalog(catalog.semester, catalog['data'](), catalog.modified);
    setupTimeMatrix((window.timeMatrix = await dataend.distances()));
    window.buildingSearcher = new FastSearcher(await dataend.buildings());
    window.watchers = new WatchFactory();
});
