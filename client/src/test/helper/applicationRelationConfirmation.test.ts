import { createApplicationRelationConfirmation } from '../../helper/applicationRelationConfirmation';

const confirmationCases = [
    {
        action: 'archive',
        state: 'active',
        relatedInterviewCount: 0,
        title: 'Confirm Archive',
        confirmationText: 'Archive',
        description: 'Archive this active job application?',
    },
    {
        action: 'archive',
        state: 'active',
        relatedInterviewCount: 1,
        title: 'Confirm Archive',
        confirmationText: 'Archive',
        description: 'Archive this active job application and its 1 related active interview?',
    },
    {
        action: 'archive',
        state: 'active',
        relatedInterviewCount: 2,
        title: 'Confirm Archive',
        confirmationText: 'Archive',
        description: 'Archive this active job application and its 2 related active interviews?',
    },
    {
        action: 'unarchive',
        state: 'archived',
        relatedInterviewCount: 0,
        title: 'Confirm Unarchive',
        confirmationText: 'Unarchive',
        description: 'Unarchive this archived job application?',
    },
    {
        action: 'unarchive',
        state: 'archived',
        relatedInterviewCount: 1,
        title: 'Confirm Unarchive',
        confirmationText: 'Unarchive',
        description: 'Unarchive this archived job application and its 1 related archived interview?',
    },
    {
        action: 'unarchive',
        state: 'archived',
        relatedInterviewCount: 2,
        title: 'Confirm Unarchive',
        confirmationText: 'Unarchive',
        description: 'Unarchive this archived job application and its 2 related archived interviews?',
    },
    {
        action: 'delete',
        state: 'active',
        relatedInterviewCount: 0,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description: 'Delete this active job application? This action is permanent and cannot be undone.',
    },
    {
        action: 'delete',
        state: 'active',
        relatedInterviewCount: 1,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description:
            'Delete this active job application and its 1 related active interview? This action is permanent and cannot be undone.',
    },
    {
        action: 'delete',
        state: 'active',
        relatedInterviewCount: 2,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description:
            'Delete this active job application and its 2 related active interviews? This action is permanent and cannot be undone.',
    },
    {
        action: 'delete',
        state: 'archived',
        relatedInterviewCount: 0,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description: 'Delete this archived job application? This action is permanent and cannot be undone.',
    },
    {
        action: 'delete',
        state: 'archived',
        relatedInterviewCount: 1,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description:
            'Delete this archived job application and its 1 related archived interview? This action is permanent and cannot be undone.',
    },
    {
        action: 'delete',
        state: 'archived',
        relatedInterviewCount: 2,
        title: 'Confirm Deletion',
        confirmationText: 'Delete',
        description:
            'Delete this archived job application and its 2 related archived interviews? This action is permanent and cannot be undone.',
    },
] as const;

describe('single-application relation confirmations', () => {
    test.each(confirmationCases)(
        'uses exact $action $state wording for $relatedInterviewCount related interviews',
        ({ action, state, relatedInterviewCount, title, confirmationText, description }) => {
            expect(createApplicationRelationConfirmation(action, state, relatedInterviewCount)).toEqual({
                title,
                description,
                confirmationText,
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true },
            });
        }
    );
});
