import formatDate from './dateFormatter';

type ApplicationCsvSource = {
    application_date: string;
    job_location: string;
    job_posting_url: string;
    notes: string;
};

type InterviewCsvSource = {
    interview_date: string;
    interview_type: string;
    interview_notes: string;
};

export const createApplicationCsvData = <T extends ApplicationCsvSource>(applications: T[]) => {
    return applications.map((application) => ({
        ...application,
        application_date: formatDate(application.application_date).formattedDate,
        job_location: application.job_location || 'N/A',
        job_posting_url: application.job_posting_url || 'N/A',
        notes: application.notes || 'N/A',
    }));
};

export const createInterviewCsvData = <T extends InterviewCsvSource>(interviews: T[]) => {
    return interviews.map((interview) => ({
        ...interview,
        interview_date: formatDate(interview.interview_date).formattedDate,
        interview_type: interview.interview_type || 'N/A',
        notes: interview.interview_notes || 'N/A',
    }));
};
