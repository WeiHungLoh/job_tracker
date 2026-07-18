import { screen, within } from '@testing-library/react';
import AttentionCenter from '../../pages/dashboard/attentionCenter/AttentionCenter';
import boardStyles from '../../pages/application/applicationBoard/ApplicationBoard.module.css';
import { getApplicationBoardStatusClassName } from '../../pages/application/applicationBoard/statusClassNames';
import type { JobApplication, JobStatus } from '../../pages/application/models';
import type { JobInterview } from '../../pages/interview/models';
import { render } from '../renderWithToast';

const currentTime = new Date('2026-07-10T12:00:00.000Z');

const createApplication = (
    jobId: number,
    jobStatus: JobStatus,
    applicationDate = '2026-06-20T12:00:00.000Z'
): JobApplication => ({
    job_id: jobId,
    company_name: `Company ${jobId}`,
    job_title: `Role ${jobId}`,
    application_date: applicationDate,
    job_status: jobStatus,
    job_location: '',
    job_posting_url: '',
    notes: '',
});

const createInterview = (jobId: number, interviewDate: string): JobInterview => ({
    interview_id: jobId,
    job_id: jobId,
    company_name: `Company ${jobId}`,
    job_title: `Role ${jobId}`,
    interview_date: interviewDate,
    interview_duration_minutes: 60,
    interview_location: '',
    interview_type: '',
    interview_notes: '',
});

describe('AttentionCenter', () => {
    test('renders concise read-only attention items without application actions', () => {
        render(
            <AttentionCenter
                applications={[
                    createApplication(1, 'Interview'),
                    createApplication(2, 'Offer'),
                    createApplication(3, 'Applied'),
                ]}
                interviews={[createInterview(1, '2026-07-09T10:00:00.000Z')]}
                currentTime={currentTime}
                isLoading={false}
            />
        );

        const list = screen.getByRole('list', { name: 'Applications needing attention' });
        expect(within(list).getAllByRole('listitem')).toHaveLength(3);
        expect(within(list).getByText('Company 1')).toBeInTheDocument();
        expect(within(list).getByText('Interview')).toBeInTheDocument();
        expect(within(list).getByText('Offer')).toBeInTheDocument();
        expect(within(list).getByText('Applied')).toBeInTheDocument();
        expect(within(list).getByText('Interview')).toHaveClass(
            boardStyles.statusBadge,
            getApplicationBoardStatusClassName('Interview')
        );
        expect(within(list).getByText('Offer')).toHaveClass(
            boardStyles.statusBadge,
            getApplicationBoardStatusClassName('Offer')
        );
        expect(within(list).getByText('Applied')).toHaveClass(
            boardStyles.statusBadge,
            getApplicationBoardStatusClassName('Applied')
        );
        expect(within(list).queryByText('•')).not.toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByText(/view application/i)).not.toBeInTheDocument();
    });

    test('keeps upcoming interviews in their existing dashboard card', () => {
        render(
            <AttentionCenter
                applications={[createApplication(1, 'Interview')]}
                interviews={[createInterview(1, '2026-07-11T10:00:00.000Z')]}
                currentTime={currentTime}
                isLoading={false}
            />
        );

        expect(screen.getByText("You're all caught up")).toBeInTheDocument();
        expect(screen.queryByText('Company 1')).not.toBeInTheDocument();
    });

    test('shows a compact loading state', () => {
        render(<AttentionCenter applications={[]} interviews={[]} currentTime={currentTime} isLoading />);

        expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
    });
});
