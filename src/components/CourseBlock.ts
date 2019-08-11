/**
 * @module components
 */

/**
 *
 */
import { Component, Prop } from 'vue-property-decorator';
import Course from '../models/Course';
import Event from '../models/Event';
import ScheduleBlock from '../models/ScheduleBlock';
import Section from '../models/Section';
import Store from '../store';
import { timeToNum, to12hr } from '../utils';

/**
 * the component for rendering a course on GridSchedule
 * @author Kaiying Shan, Hanzhi Zhou
 * @noInheritDoc
 */
@Component
export default class CourseBlock extends Store {
    @Prop(ScheduleBlock) readonly scheduleBlock!: ScheduleBlock;
    @Prop(Array) readonly heightInfo!: number[];
    @Prop(Number) readonly absoluteEarliest!: number;
    @Prop(String) readonly day!: string;

    get startPx() {
        return this.getPx(this.scheduleBlock.start);
    }

    get endPx() {
        return this.getPx(this.scheduleBlock.end);
    }

    getPx(time: string) {
        let px = 48;
        const t = time.split(':');
        const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

        const temp = timeToNum(time);
        for (let i = this.absoluteEarliest; i < temp; i++) {
            px += this.heightInfo[i - this.absoluteEarliest];
        }
        px += (min / 30) * this.display.fullHeight;
        return px;
    }

    get firstSec(): Section {
        const section = this.scheduleBlock.section;
        if (section instanceof Course) return section.getFirstSection();
        else if (section instanceof Section) return section;
        return (section as any) as Section;
    }

    get room() {
        if (!(this.firstSec instanceof Section)) return null;

        for (const meeting of this.firstSec.meetings) {
            if (meeting.days.indexOf(this.day) !== -1) {
                const convedStart = to12hr(this.scheduleBlock.start);
                const convedEnd = to12hr(this.scheduleBlock.end);
                const [, start, , end] = meeting.days.split(' ');
                if (convedStart === start && convedEnd === end) {
                    return meeting.room;
                }
            }
        }
        return null;
    }
    get isSection() {
        return this.scheduleBlock.section instanceof Section;
    }
    get isEvent() {
        return this.scheduleBlock.section instanceof Event;
    }
    get isCourse() {
        return this.scheduleBlock.section instanceof Course;
    }

    showModal() {
        const section = this.scheduleBlock.section;
        if (this.isSection) {
            this.modal.showSectionModal(section as Section);
        } else if (this.isCourse) {
            this.modal.showCourseModal(section as Course);
        } else if (this.isEvent) {
            if (!this.status.sideBar.showEvent) this.status.switchSideBar('showEvent');
            this.status.eventToEdit = section as Event;
        }
    }
}
