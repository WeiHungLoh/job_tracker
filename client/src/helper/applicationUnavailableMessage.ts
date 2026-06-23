type UnavailableMessageLabels = {
    applicationLabel: string;
    applicationsPageLabel: string;
    statusFilterLabel: string;
};

export const getApplicationUnavailableMessage = (
    selectedStatus: string,
    applicationStatus: string | undefined,
    labels: UnavailableMessageLabels
): string => {
    if (selectedStatus === 'Show All') {
        return `${labels.applicationLabel} is not available in ${labels.applicationsPageLabel}.`;
    }

    return `${labels.applicationLabel} is not inside the current ${selectedStatus} filter. Change the ${labels.statusFilterLabel} to Show All${applicationStatus ? ` or ${applicationStatus}` : ''}.`;
};
