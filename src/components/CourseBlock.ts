import ScheduleBlock from '../models/ScheduleBlock';
import Section from '../models/Section';
import Course from '../models/Course';
import Event from '../models/Event';
import { to12hr, timeToNum } from '../models/Utils';
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class CourseBlock extends Vue {
    @Prop(Object) readonly scheduleBlock!: ScheduleBlock;
    @Prop(Array) readonly heightInfo!: number[];
    @Prop(Number) readonly fullHeight!: number;
    @Prop(Number) readonly partialHeight!: number;
    @Prop(Boolean) readonly showTime!: boolean;
    @Prop(Boolean) readonly showRoom!: boolean;
    @Prop(Boolean) readonly showInstructor!: boolean;
    @Prop(Number) readonly absoluteEarliest!: number;
    @Prop(String) readonly day!: string;

    mobile = window.screen.width < 450;

    get startPx() {
        return this.getPx(this.scheduleBlock.start, true);
    }

    get endPx() {
        return this.getPx(this.scheduleBlock.end, false);
    }

    getPx(time: string, start: boolean) {
        let px = 48;
        const t = time.split(':');
        const min = parseInt(t[1]) >= 30 ? parseInt(t[1]) - 30 : parseInt(t[1]);

        const temp = timeToNum(time, start);
        for (let i = this.absoluteEarliest; i < temp; i++) {
            px += this.heightInfo[i - this.absoluteEarliest];
        }
        px += (min / 30) * this.fullHeight;
        return px;
    }

    get firstSec() {
        const section = this.scheduleBlock.section;
        if (section instanceof Course) return section.getFirstSection();
        else return section;
    }

    get room() {
        if (!(this.firstSec instanceof Section)) return null;

        for (const meeting of this.firstSec.meetings) {
            if (meeting.days.indexOf(this.day) !== -1) {
                const convedStart = to12hr(this.scheduleBlock.start);
                const convedEnd = to12hr(this.scheduleBlock.end);
                const [days, start, , end] = meeting.days.split(' ');
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
        const $parent = this.$parent as any;
        const section = this.scheduleBlock.section;
        if (this.isSection) {
            $parent.$emit('trigger-modal', section);
        } else if (this.isCourse) {
            $parent.$parent.showCourseModal(section);
        } else if (this.isEvent) {
            $parent.$emit('editEvent', section);
        }
    }
}
