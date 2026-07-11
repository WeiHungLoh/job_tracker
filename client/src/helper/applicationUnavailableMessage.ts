type UnavailableMessageLabels = {
    applicationLabel: string;
    applicationsPageLabel: string;
    statusFilterLabel: string;
};

export const ACTIVE_APPLICATION_BOARD_MESSAGE =
    'The corresponding job application can only be opened while active applications are displayed in List view. Switch to List view and try again.';

export const ARCHIVED_APPLICATION_BOARD_MESSAGE =
    'The corresponding archived job application can only be opened while archived applications are displayed in List view. Switch to List view and try again.';

export const getApplicationUnavailableMessage = (
    selectedStatuses: readonly string[],
    applicationStatus: string | undefined,
    labels: UnavailableMessageLabels
): string => {
    if (!applicationStatus || selectedStatuses.includes(applicationStatus)) {
        return `${labels.applicationLabel} is not available in ${labels.applicationsPageLabel}.`;
    }

    return `${labels.applicationLabel} is not included in the current ${labels.statusFilterLabel}. Select Show All or ${applicationStatus}.`;
};
