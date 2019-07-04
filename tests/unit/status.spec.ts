import status from '@/store/status';

test('store.status', () => {
    status.switchSideBar('showCompare');
    expect(status.sideBar.showCompare).toBe(true);
    expect(status.sideBarActive).toBe(true);

    status.foldAllSideBar();
    expect(status.sideBarActive).toBe(false);
    status.foldView();
});
