import { useState } from 'react';
import type { FormErrors } from './models';

export const useFormErrors = <TField extends string>() => {
    const [errors, setErrors] = useState<FormErrors<TField>>({});

    const clearFieldError = (field: TField) => {
        setErrors((currentErrors) => {
            if (!currentErrors[field]) {
                return currentErrors;
            }

            return { ...currentErrors, [field]: undefined };
        });
    };

    return { clearFieldError, errors, setErrors };
};
