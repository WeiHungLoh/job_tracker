import { isInvalidDatetimeLocalInput } from '../../helper/dateFormatter';

describe('datetime-local validation', () => {
    test('rejects impossible calendar dates instead of normalizing them', () => {
        expect(isInvalidDatetimeLocalInput('2025-02-29T10:00')).toBe(true);
        expect(isInvalidDatetimeLocalInput('2025-02-30T10:00')).toBe(true);
        expect(isInvalidDatetimeLocalInput('2025-04-31T10:00')).toBe(true);
    });

    test('accepts valid calendar dates including leap day', () => {
        expect(isInvalidDatetimeLocalInput('2024-02-29T10:00')).toBe(false);
        expect(isInvalidDatetimeLocalInput('2025-04-30T10:00')).toBe(false);
    });

    test('rejects invalid times', () => {
        expect(isInvalidDatetimeLocalInput('2025-04-30T24:00')).toBe(true);
        expect(isInvalidDatetimeLocalInput('2025-04-30T23:60')).toBe(true);
    });
});
