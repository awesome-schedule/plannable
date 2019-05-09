import Meta, { getDefaultData } from '../../src/models/Meta';

describe('meta tests', () => {
    it('default data validation', () => {
        const defaultData = getDefaultData();
        for (const field of Meta.storageFields) {
            expect(defaultData).toHaveProperty(field);
        }
    });
});
