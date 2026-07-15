import type { FormErrors } from './models';

type FocusableRef = {
    readonly current: { focus: () => void } | null;
};

export const focusFirstInvalidField = <TField extends string>(
    errors: FormErrors<TField>,
    fields: ReadonlyArray<readonly [TField, FocusableRef]>
) => {
    for (const [field, ref] of fields) {
        if (errors[field]) {
            ref.current?.focus();
            return;
        }
    }
};
