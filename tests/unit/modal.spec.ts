import data from './data';
import modal from '@/store/modal';

beforeAll(async () => {
    window.catalog = await data;
});

describe('modal', () => {
    it('basic', () => {
        modal.showCourseModal(window.catalog.getCourse('cs11105'));
        modal.showSectionModal(window.catalog.getCourse('cs11105').getFirstSection());
    });
});
