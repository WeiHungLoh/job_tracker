import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import * as commonPackage from '@zxcvbn-ts/language-common';

export type PasswordStrength = {
    label: string;
    score: number;
};

const strengthEstimator = new ZxcvbnFactory({
    dictionary: commonPackage.dictionary,
    graphs: commonPackage.adjacencyGraphs,
});

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

export const estimatePasswordStrength = (password: string, email: string): PasswordStrength => {
    const result = strengthEstimator.check(password, email ? [email] : []);
    return {
        label: STRENGTH_LABELS[result.score],
        score: result.score,
    };
};
