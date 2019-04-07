import Section from './Section';
import Meeting from './Meeting';

class ScheduleBlock {
    public backgroundColor: string;
    public start: string;
    public end: string;
    public section: Section | Section[];

    constructor(backgroundColor: string, start: string, end: string, section: Section | Section[]) {
        this.backgroundColor = backgroundColor;
        this.start = start;
        this.end = end;
        this.section = section;
    }
}

export default ScheduleBlock;
