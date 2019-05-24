/**
 *
 */
import { Component } from 'vue-property-decorator';
import Store, { SemesterStorage } from '../store';
import { savePlain, toICal } from '../utils';

@Component
export default class ExportView extends Store {
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
                    this.noti.error(error.message + ': File Format Error');
                    return;
                }
                localStorage.setItem(raw_data.currentSemester.id, result);
                this.semester.selectSemester(raw_data.currentSemester);
            } else {
                this.noti.warn('File is empty!');
            }
        };

        try {
            reader.readAsText(input.files[0]);
        } catch (error) {
            console.warn(error);
            this.noti.error(error.message);
        }
    }
    saveToJson() {
        if (!this.semester.currentSemester) return;
        const json = localStorage.getItem(this.semester.currentSemester.id);
        if (json) savePlain(json, (this.exportJson ? this.exportJson : 'schedule') + '.json');
    }
    saveToIcal() {
        savePlain(
            toICal(this.schedule.currentSchedule),
            (this.exportICal ? this.exportICal : 'schedule') + '.ical'
        );
    }
    print() {
        window.print();
    }
}
