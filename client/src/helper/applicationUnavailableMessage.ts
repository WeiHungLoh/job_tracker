type UnavailableMessageLabels = {
    applicationLabel: string;
    applicationsPageLabel: string;
    statusFilterLabel: string;
};

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
