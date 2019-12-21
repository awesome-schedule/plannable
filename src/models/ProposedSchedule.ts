import Schedule, { ScheduleJSON, ScheduleAll } from './Schedule';
import Event from './Event';
import { NotiMsg } from '@/store/notification';
import * as Utils from '../utils';
import { TYPES, DAYS } from './Meta';

export default class ProposedSchedule extends Schedule {
    constructor(raw: ScheduleAll = {}, events: Event[] = []) {
        super(raw, events);
    }

    /**
     * Update a section in the schedule
     * - If the section is **already in** the schedule, delete it from the schedule
     * - If the section is **not** in the schedule, add it to the schedule
     * @param remove whether to remove the key if the set of sections is empty
     */
    public update(key: string, section: number, remove = true) {
        if (section === -1) {
            if (this.All[key] === -1) {
                if (remove) delete this.All[key];
                // empty set if remove is false
                else this.All[key] = new Set();
            } else this.All[key] = -1;
        } else {
            const sections = this.All[key];
            if (sections instanceof Set) {
                if (sections.delete(section)) {
                    if (sections.size === 0 && remove) delete this.All[key];
                } else {
                    sections.add(section);
                }
            } else {
                this.All[key] = new Set([section]);
            }
        }
        this.constructDateSeparator();
        this.computeSchedule();
    }

    /**
     * add an event to this schedule
     * @throws error if an existing event conflicts with this event
     */
    public addEvent(
        days: string,
        display: boolean,
        title?: string,
        room?: string,
        description?: string
    ) {
        for (const e of this.events) {
            if (e.days === days) {
                throw new Error(
                    `Your new event's time is identical to ${e.title}. Please consider merging these two events.`
                );
            }
        }
        this.events.push(new Event(days, display, title, description, room));
        this.computeSchedule();
    }

    public deleteEvent(days: string) {
        for (let i = 0; i < this.events.length; i++) {
            if (this.events[i].days === days) {
                this.events.splice(i, 1);
                break;
            }
        }
        this.computeSchedule();
    }

    /**
     * instantiate a `Schedule` object from its JSON representation.
     * the `computeSchedule` method will be invoked after instantiation
     *
     * @returns NotiMsg, whose level might be one of the following
     * 1. success: a schedule is successfully parsed from the JSON object
     * 2. warn: a schedule is successfully parsed, but some of the courses/sections recorded no longer exist
     * in the catalog
     * 3. error: the object passed in is falsy
     */
    public static fromJSON(obj?: ScheduleJSON): NotiMsg<ProposedSchedule> {
        if (!obj)
            return {
                level: 'error',
                msg: 'Invalid object'
            };
        const schedule = new ProposedSchedule();
        if (obj.events)
            schedule.events = obj.events.map(x =>
                x instanceof Event ? x : Object.setPrototypeOf(x, Event.prototype)
            );

        const keys = Object.keys(obj.All).map(x => x.toLowerCase());
        if (keys.length === 0)
            return {
                level: 'success',
                msg: 'Empty schedule',
                payload: schedule
            };

        const warnings = [];
        const catalog = window.catalog;
        const regex = /([a-z]{1,5})([0-9]{1,5})([0-9])$/i;
        // convert array to set
        for (const key of keys) {
            const sections = obj.All[key];
            const course = catalog.getCourse(key);
            const parts = key.match(regex);

            // converted key
            let convKey = key;
            if (parts && parts.length === 4) {
                parts[3] = TYPES[+parts[3] as 1];
                parts[1] = parts[1].toUpperCase();
                convKey = parts.slice(1).join(' ');
            }
            // non existent course
            if (!course) {
                warnings.push(`${convKey} does not exist anymore! It probably has been removed!`);
                continue;
            }
            const allSections = course.sections;
            if (sections instanceof Array) {
                if (!sections.length) {
                    schedule.All[key] = new Set();
                } else {
                    // backward compatibility for version prior to v5.0 (inclusive)
                    if (Utils.isNumberArray(sections)) {
                        const secs = sections as number[];
                        schedule.All[key] = new Set(
                            secs
                                .filter(sid => {
                                    // sid >= length possibly implies that section is removed from SIS
                                    if (sid >= allSections.length) {
                                        warnings.push(
                                            `Invalid section id ${sid} for ${convKey}. It probably has been removed!`
                                        );
                                    }
                                    return sid < allSections.length;
                                })
                                .map(idx => allSections[idx].id)
                        );
                    } else {
                        const set = new Set<number>();
                        for (const record of sections) {
                            // check whether the identifier of stored sections match with the existing sections
                            const target =
                                typeof record.section === 'undefined' // "section" property may not be recorded
                                    ? allSections.find(sec => sec.id === record.id) // in that case we only compare id
                                    : allSections.find(
                                          sec =>
                                              sec.id === record.id && sec.section === record.section
                                      );
                            if (target) set.add(target.id);
                            // if not exist, it possibly means that section is removed from SIS
                            else
                                warnings.push(
                                    `Section ${record.section} of ${convKey} does not exist anymore! It probably has been removed!`
                                );
                        }
                        schedule.All[key] = set;
                    }
                }
            } else {
                schedule.All[key] = sections;
            }
        }
        if (warnings.length) {
            return {
                level: 'warn',
                payload: schedule,
                msg: warnings.join('<br>')
            };
        } else {
            return {
                level: 'success',
                payload: schedule,
                msg: 'Success'
            };
        }
    }

    /**
     * get a copy of this schedule
     */
    public copy(deepCopyEvent = true) {
        const AllCopy: ScheduleAll = {};
        for (const key in this.All) {
            const sections = this.All[key];
            if (sections instanceof Set) {
                AllCopy[key] = new Set(sections);
            } else {
                AllCopy[key] = sections;
            }
        }
        // note: is it desirable to deep-copy all the events?
        return new ProposedSchedule(
            AllCopy,
            deepCopyEvent ? this.events.map(e => e.copy()) : this.events
        );
    }

    /**
     * add some random event to the schedule. For testing purposes only
     */
    private randEvents(num = 20, maxDuration = 120, minDuration = 20) {
        for (let i = 0; i < num; i++) {
            let days = '';
            for (let j = 0; j < 7; j++) {
                if (Math.random() < 0.5) {
                    days += DAYS[j];
                }
            }
            if (!days) {
                i--;
                continue;
            }
            const start = Math.floor(Math.random() * (1440 - maxDuration));
            const end =
                start +
                minDuration +
                Math.floor(Math.random() * Math.min(1440 - start, maxDuration));

            days +=
                ' ' +
                Utils.to12hr(Utils.intTo24hr(start)) +
                ' - ' +
                Utils.to12hr(Utils.intTo24hr(end));
            try {
                this.addEvent(days, true, 'rand ' + i);
            } catch (e) {
                console.log(e);
                i--;
            }
        }
    }

    /**
     * Remove a course (and all its sections) from the schedule
     */
    public remove(key: string) {
        delete this.All[key];
        this.constructDateSeparator();
        this.computeSchedule();
    }
}
