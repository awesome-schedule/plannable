import modal from '@/store/modal';

describe('modal', () => {
    it('basic', () => {
        modal.showCourseModal(window.catalog.getCourse('cs11105'));
        modal.showSectionModal(window.catalog.getCourse('cs11105').getFirstSection());
    });
});
