/**
 * @module src/components
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
import { hr12toInt, roundTime } from '../utils';

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
    get section() {
        return this.scheduleBlock.section;
    }
    get startPx() {
        return this.getPx(this.scheduleBlock.startMin);
    }
    get endPx() {
        return this.getPx(this.scheduleBlock.endMin);
    }

    getPx(time: number) {
        const idx = roundTime(time) - this.absoluteEarliest - 1;
        return (
            48 +
            (idx <= 0 ? 0 : this.heightInfo[idx]) +
            ((time % 30) / 30) * this.display.fullHeight
        );
    }

    get firstSec(): Section {
        const section = this.scheduleBlock.section;
        if (section instanceof Course) return section.sections[0];
        else if (section instanceof Section) return section;
        return section as any;
    }

    /**
     * parse the room from the section contained in this scheduleBlock
     */
    get room() {
        if (!(this.firstSec instanceof Section)) return null;

        for (const meeting of this.firstSec.meetings) {
            if (meeting.days.includes(this.day)) {
                const [, start, , end] = meeting.days.split(' ');
                if (
                    this.scheduleBlock.startMin === hr12toInt(start) &&
                    this.scheduleBlock.endMin === hr12toInt(end)
                ) {
                    return meeting.room;
                }
            }
        }
        return null;
    }
    isSection(a: any): a is Section {
        return a instanceof Section;
    }
    isEvent(a: any): a is Event {
        return a instanceof Event;
    }
    isCourse(a: any): a is Course {
        return a instanceof Course;
    }

    showModal() {
        const section = this.section;
        if (this.isSection(section)) {
            this.modal.showSectionModal(section);
        } else if (this.isCourse(section)) {
            this.modal.showCourseModal(section);
        } else if (this.isEvent(section)) {
            if (!this.status.sideBar.showEvent) this.status.switchSideBar('showEvent');
            this.status.eventToEdit = section;
        }
    }
}
