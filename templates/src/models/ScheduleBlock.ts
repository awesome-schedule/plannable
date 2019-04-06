import Section from './Section';
import Meeting from './Meeting';

class ScheduleBlock {
    public backgroundColor: string;
    public start: string;
    public end: string;
    public section: Section | Section[];
    public key: string;
    public meeting: Meeting;

    constructor(
        backgroundColor: string,
        start: string,
        end: string,
        section: Section | Section[],
        meeting: Meeting
    ) {
        this.backgroundColor = backgroundColor;
        this.start = start;
        this.end = end;
        this.section = section;
        this.meeting = meeting;
        if (section instanceof Array) {
            this.key = section[0].course.key;
        } else {
            this.key = section.course.key;
        }
    }
}

export default ScheduleBlock;
