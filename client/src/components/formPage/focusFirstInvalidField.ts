import type { FormErrors } from './models';

type FocusableRef = {
    readonly current: {
        focus: (options?: FocusOptions) => void;
        scrollIntoView?: (options?: ScrollIntoViewOptions) => void;
    } | null;
};

const INVALID_FIELD_SCROLL_OPTIONS: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center',
};

export const focusFirstInvalidField = <TField extends string>(
    errors: FormErrors<TField>,
    fields: ReadonlyArray<readonly [TField, FocusableRef]>
) => {
    for (const [field, ref] of fields) {
        if (errors[field]) {
            ref.current?.scrollIntoView?.(INVALID_FIELD_SCROLL_OPTIONS);
            ref.current?.focus({ preventScroll: true });
            return;
        }
    }
};
