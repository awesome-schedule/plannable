import { toICal } from '@/utils';
import ProposedSchedule from '@/models/ProposedSchedule';

describe('ical test', () => {
    /**
     * Kaiying Shan
     * @todo throughout test
     */
    it('basic', () => {
        const json = `{"All":{"cs21505":[0],"cs21504":[1], "cs11105": [0]},
        "id":1,"title":"Schedule","events":[],"savedColors":{"cs21505":"#af2007","cs21504":"#068239"}}`;
        const parsed = JSON.parse(json);
        const { payload: schedule } = ProposedSchedule.fromJSON(parsed)!;
        schedule!.addEvent('MoTuFr 5:00AM - 7:00AM', true, 'title');
        schedule!.computeSchedule();
        expect(toICal(schedule!)).toBeTruthy();
    });
});
