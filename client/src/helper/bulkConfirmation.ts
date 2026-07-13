import type { KeyboardEvent } from 'react';
import type { ConfirmOptions } from 'material-ui-confirm';

const countLabel = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

type CollectionState = 'active' | 'archived';

const preventEnterConfirmation = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
    }
};

const bulkOptions = (title: string, description: string, confirmationText: string): ConfirmOptions => ({
    title,
    description,
    confirmationText,
    cancellationText: 'Cancel',
    confirmationButtonProps: { autoFocus: false, onKeyDown: preventEnterConfirmation },
});

const applicationDescription = (
    action: 'Archive' | 'Delete' | 'Unarchive',
    applicationCount: number,
    interviewCount: number,
    state: CollectionState
) => {
    const applicationLabel = countLabel(applicationCount, `${state} job application`);
    const interviewLabel = countLabel(interviewCount, `related ${state} interview`);
    const filterLabel = state === 'archived' ? 'archived job-status filters' : 'job-status filters';
    const permanence = action === 'Delete' ? ' This action is permanent and cannot be undone.' : '';

    return `${action} all ${applicationLabel} and ${
        applicationCount === 1 ? 'its' : 'their'
    } ${interviewLabel}? This affects every ${state} application you own, including applications not visible under the current ${filterLabel}.${permanence}`;
};

export const createArchiveAllConfirmation = (applicationCount: number, interviewCount: number): ConfirmOptions =>
    bulkOptions(
        'Confirm Archive All',
        applicationDescription('Archive', applicationCount, interviewCount, 'active'),
        'Archive All'
    );

export const createUnarchiveAllConfirmation = (applicationCount: number, interviewCount: number): ConfirmOptions =>
    bulkOptions(
        'Confirm Unarchive All',
        applicationDescription('Unarchive', applicationCount, interviewCount, 'archived'),
        'Unarchive All'
    );

export const createDeleteAllApplicationsConfirmation = (
    applicationCount: number,
    interviewCount: number,
    state: CollectionState
): ConfirmOptions =>
    bulkOptions(
        'Confirm Delete All',
        applicationDescription('Delete', applicationCount, interviewCount, state),
        'Delete All'
    );

export const createDeleteAllInterviewsConfirmation = (
    interviewCount: number,
    state: CollectionState
): ConfirmOptions => {
    const interviewLabel = countLabel(interviewCount, `${state} interview`);

    return bulkOptions(
        'Confirm Delete All',
        `Delete all ${interviewLabel} you own? This affects every ${state} interview in your account. This action is permanent and cannot be undone.`,
        'Delete All'
    );
};

export const createBulkCalendarExportConfirmation = (interviewCount: number): ConfirmOptions => {
    const interviewLabel = countLabel(interviewCount, 'upcoming interview');

    return bulkOptions(
        'Export all upcoming interviews?',
        `This will download one .ics file containing all ${interviewLabel}, including interviews you may already have added to your calendar. Importing the file again may create duplicate calendar events.`,
        'Export All'
    );
};
