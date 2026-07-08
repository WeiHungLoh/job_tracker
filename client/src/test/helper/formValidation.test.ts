import {
    getPasswordValidationError,
    normalizeEmail,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    validateApplicationForm,
    validateInterviewForm,
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

describe('job tracker form validation', () => {
    test('normalizes valid application form values', () => {
        const result = validateApplicationForm(
            {
                applicationDate: '',
                companyName: '  Acme  ',
                jobLocation: '  Remote  ',
                jobTitle: '  Engineer  ',
                jobURL: '  https://jobs.example.com/engineer  ',
            },
            new Date('2026-07-08T10:00:00')
        );

        expect(result).toEqual({
            isValid: true,
            values: {
                applicationDate: new Date('2026-07-08T10:00:00'),
                companyName: 'Acme',
                jobLocation: 'Remote',
                jobTitle: 'Engineer',
                jobURL: 'https://jobs.example.com/engineer',
            },
        });
    });

    test('rejects invalid application and interview values with shared messages', () => {
        expect(
            validateApplicationForm({
                applicationDate: '',
                companyName: '',
                jobLocation: '',
                jobTitle: 'Engineer',
                jobURL: '',
            })
        ).toEqual({
            error: 'Please enter company name and job title before adding a job application.',
            isValid: false,
        });

        expect(
            validateInterviewForm({
                applicationDate: '2026-07-08T10:00',
                interviewDate: '2026-07-08T09:00',
                interviewLocation: 'Zoom',
                interviewType: '',
                notes: '',
            })
        ).toEqual({
            error: 'Interview date must be after the job application date.',
            isValid: false,
        });
    });
});
