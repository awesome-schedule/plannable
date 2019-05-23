/**
 *
 */
import { Vue, Component } from 'vue-property-decorator';
import { semester, noti, schedule } from '../store';
import { SemesterStorage } from '../store/helper';
import { savePlain, toICal } from '../utils';

@Component
export default class ExportView extends Vue {
    exportJson: string = 'schedule';
    exportICal: string = 'schedule';

    onUploadJson(event: { target: EventTarget | null }) {
        const input = event.target as HTMLInputElement;

        if (!input.files) return;

        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                let raw_data: SemesterStorage, result;
                try {
                    result = reader.result.toString();
                    raw_data = JSON.parse(result);
                } catch (error) {
                    console.error(error);
                    noti.error(error.message + ': File Format Error');
                    return;
                }
                localStorage.setItem(raw_data.currentSemester.id, result);
                semester.selectSemester(raw_data.currentSemester.id);
            } else {
                noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.warn(error);
            noti.error(error.message);
        }
    }
    saveToJson() {
        if (!semester.currentSemester) return;
        const json = localStorage.getItem(semester.currentSemester.id);
        if (json) savePlain(json, (this.exportJson ? this.exportJson : 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(
            toICal(schedule.currentSchedule),
            (this.exportICal ? this.exportICal : 'schedule') + '.ical'
        );
    }
    print() {
        window.print();
    }
}
