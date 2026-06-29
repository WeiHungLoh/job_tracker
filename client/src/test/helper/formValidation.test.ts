import {
    getPasswordValidationError,
    normalizeEmail,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
} from '../../helper/formValidation';

describe('authentication form validation', () => {
    test('normalizes email addresses', () => {
        expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com');
    });

    test('enforces password length without composition rules', () => {
        expect(getPasswordValidationError('x'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
            'Password must be at least 15 characters.'
        );
        expect(getPasswordValidationError('words with spaces')).toBeUndefined();
        expect(getPasswordValidationError(`${'x'.repeat(63)}😀`)).toBeUndefined();
        expect(getPasswordValidationError('x'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
            'Password must be 64 characters or fewer.'
        );
        expect(getPasswordValidationError('😀'.repeat(19))).toBe(
            'Password is too long when encoded. Use fewer Unicode characters.'
        );
    });
});
