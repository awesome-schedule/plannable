import palette from '@/store/palette';

test('palette', () => {
    const str1 = JSON.stringify(palette.toJSON());
    palette.fromJSON(JSON.parse(str1));
    const str2 = JSON.stringify(palette.toJSON());
    expect(str1).toBe(str2);
    palette.getDefault();
});
