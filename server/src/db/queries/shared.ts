export const JOB_STATUS_SORT_ORDER = `
    CASE
        WHEN job_status = 'Accepted' THEN 1
        WHEN job_status = 'Offer' THEN 2
        WHEN job_status = 'Declined' THEN 3
        WHEN job_status = 'Interview' THEN 4
        WHEN job_status = 'Applied' THEN 5
        WHEN job_status = 'Ghosted' THEN 6
        ELSE 7
    END`;
