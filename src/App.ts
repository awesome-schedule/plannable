/**
 * the "view" of this project; the root Vue component that contains almost all of the child components and DOM
 * elements of the main webpage.
 * @author Hanzhi Zhou, Kaiying Shan, Elena Long, Zichao Hu
 */

/**
 *
 */
import axios from 'axios';
import { Component } from 'vue-property-decorator';
import MainContent from './components/MainContent.vue';

// tab components
import ClassView from './components/tabs/ClassView.vue';
import CompareView from './components/tabs/CompareView.vue';
import DisplayView from './components/tabs/DisplayView.vue';
import EventView from './components/tabs/EventView.vue';
import ExportView from './components/tabs/ExportView.vue';
import External from './components/tabs/External.vue';
import FilterView from './components/tabs/FilterView.vue';
import PaletteView from './components/tabs/PaletteView.vue';

// other components
import CourseModal from './components/CourseModal.vue';
import DateSeparator from './components/DateSeparator.vue';
import GridSchedule from './components/GridSchedule.vue';
import Pagination from './components/Pagination.vue';
import SectionModal from './components/SectionModal.vue';
import URLModal from './components/URLModal.vue';
import VersionModal from './components/VersionModal.vue';

import randomColor from 'randomcolor';
import config from './config';
import { loadBuildingList, loadTimeMatrix } from './data/BuildingLoader';
import Store, { parseFromURL } from './store';

const version = '6.5';
let note = 'loading release note...';
/**
 * returns whether the version stored in localStorage matches the current version
 * then, override localStorage with the current version
 */
function checkVersion() {
    const match = localStorage.getItem('version') === version;
    localStorage.setItem('version', version);
    if (!match) {
        triggerVersionModal();
    }
    return match;
}

async function triggerVersionModal() {
    await releaseNote();
    $('#versionModal').modal();
}

/**
 * Get release note for current version && render.
 * Part of this function can be seen as an extremely-lightweight MarkDown renderer.
 * @author Kaiying Cat
 */
async function releaseNote() {
    try {
        const res = await axios.get(
            'https://api.github.com/repos/awesome-schedule/plannable/releases'
        );

        /**
         * Records the # of layers (of "ul") that this line is at.
         * Denoted by the number of spaces before a "- " in the front of the current line.
         * If this line is not in an "ul", it will be set to -1 at the end of the callback function
         * in .map()'s parameter.
         */
        let ul = -1;
        note = (res.data[0].body as string)
            .split(/[\r\n]+/)
            .map(x => {
                /**
                 * Records the number corresponds to the largeness of header.
                 * It is 0 if this line is not a header.
                 */
                let head = 0;
                /**
                 * Records if this line is in an "ul" or not by checking if this line starts with "- ";
                 */
                let li = 0;
                let result =
                    x
                        .replace(/^(#*)(\s)/, (s1: string, match1: string, match2: string) => {
                            /**
                             * Replace # to <h1> (and so on...) and set the variable "header",
                             * so that "header" can be used
                             * to close this element (give it a "</h1>")
                             */
                            return match1.length === 0
                                ? match2
                                : '<h' + (head = match1.length) + '>';
                        })
                        .replace(/^(\s*)-\s/, (s: string, match: string) => {
                            /**
                             * Replace "- Cats are the best" with "<li>Cats are the best</li>"
                             * Set appropriate list group information
                             */
                            if (head !== 0) return match + '- ';
                            let tag = '';
                            if (match.length > ul) {
                                tag = '<ul>';
                            } else if (match.length < ul) {
                                tag = '</ul>';
                            }
                            ul = match.length;
                            li = 1;
                            return `${tag}<li>`;
                        })
                        .replace(/!\[([\w -]+)\]\(([\w -/:]+)\)/, (s, match1: string, match2) => {
                            // convert md image to html
                            return `<img src=${match2} alt=${match1}></img>`;
                        })
                        .replace('<img', '<img class="img-fluid my-3" ') +
                    (head === 0
                        ? li === 0
                            ? /<\/?\w+>/.exec(x)
                                ? ''
                                : '<br />'
                            : '</li>'
                        : `</h${head}>`);
                if (li === 0 && ul !== -1) {
                    // append "</ul>"s according to the variable "ul"
                    result = '</ul>'.repeat(ul / 4 + 1) + result;
                    ul = -1;
                }
                return result;
            })
            .join(' ');
    } catch (err) {
        note =
            'Failed to obtain release note.' +
            ' See https://github.com/awesome-schedule/plannable/releases instead.';
    }
}

@Component({
    components: {
        MainContent,
        ClassView,
        EventView,
        DisplayView,
        FilterView,
        PaletteView,
        ExportView,
        CompareView,
        Pagination,
        GridSchedule,
        SectionModal,
        CourseModal,
        URLModal,
        VersionModal,
        External,
        DateSeparator,
        // use dynamic component for this one because it is relatively large in size
        Information: () => import('./components/tabs/Information.vue'),
        // opt-in components
        FuzzyView: () => import('./components/tabs/FuzzyView.vue'),
        LogView: () => import('./components/tabs/LogView.vue')
    }
})
export default class App extends Store {
    note: string = note;

    get sideBar() {
        return this.status.sideBar;
    }

    get version() {
        return version;
    }

    refreshNote() {
        $('#release-note-body').html(note);
    }

    async loadCoursesFromURL() {
        const courseArray = new URLSearchParams(window.location.search).get('courses');
        if (courseArray) {
            try {
                const courses = JSON.parse(decodeURIComponent(courseArray));
                if (courses && courses instanceof Array && courses.length) {
                    const schedule = this.schedule.getDefault();
                    courses.forEach(key => (schedule.currentSchedule.All[key] = -1));
                    this.profile.addProfile(JSON.stringify({ schedule }), 'Li Hao');
                    await this.loadProfile(undefined, !checkVersion());

                    this.noti.success('Courses loaded from ' + config.backendName, 3, true);
                    return true;
                } else {
                    throw new Error('Invalid course format');
                }
            } catch (e) {
                this.noti.error(
                    `Failed to load courses from ${config.backendName}: ` + e.message,
                    3,
                    true
                );
                return false;
            }
        }
        return false;
    }

    async loadConfigFromURL() {
        const encoded = new URLSearchParams(window.location.search).get('config');

        if (encoded) {
            try {
                this.profile.addProfile(JSON.stringify(parseFromURL(encoded)), 'url loaded');
                await this.loadProfile(undefined, !checkVersion());
                this.noti.success('Configuration loaded from URL!', 3, true);
                return true;
            } catch (err) {
                console.error(err);
                this.noti.error(err.message + ': Parsing error');
            }
        }
        return false;
    }

    /**
     * load credentials from backend
     */
    loadCredentials() {
        const search = new URLSearchParams(window.location.search);
        const username = search.get('username'),
            credential = search.get('credential');
        if (username && credential) {
            localStorage.setItem('username', username);
            localStorage.setItem('credential', credential);
            return true;
        }
    }

    async created() {
        this.status.loading = true;

        // note: these three can be executed in parallel, i.e. they are not inter-dependent
        const [pay1, pay2, pay3] = await Promise.all([
            loadTimeMatrix(),
            loadBuildingList(),
            this.semester.loadSemesters()
        ]);

        this.noti.notify(pay1);
        if (pay1.payload) window.timeMatrix = pay1.payload;

        this.noti.notify(pay2);
        if (pay2.payload) window.buildingList = pay2.payload;

        this.noti.notify(pay3);
        if (pay3.payload) {
            this.semester.semesters = pay3.payload;
            const cre = this.loadCredentials();
            const urlResult = (await this.loadConfigFromURL()) || (await this.loadCoursesFromURL());
            if (!urlResult) {
                this.profile.initProfiles(this.semester.semesters);
                // if version mismatch, force-update semester data
                await this.loadProfile(this.profile.current, !checkVersion());
            }
            // clear url after obtained credentials/courses/config
            if (urlResult || cre) history.replaceState(history.state, 'current', '/');
        }

        this.status.loading = false;
    }
    /**
     * @returns return the index of current schedule in compares array.
     *          return -1 if current schedule is not in compares.
     */
    indexOfCompare() {
        return this.compare.findIndex(c => c.schedule.equals(this.schedule.currentSchedule));
    }

    addToCompare() {
        const idx = this.indexOfCompare();
        if (idx !== -1) {
            this.compare.splice(idx, 1);
        } else {
            const color = randomColor({
                luminosity: 'dark'
            }) as string;
            this.compare.push({
                schedule: this.schedule.currentSchedule,
                profileName: this.profile.current,
                index: this.schedule.currentScheduleIndex,
                color,
                pIdx: this.schedule.cpIndex
            });
        }
    }
}
