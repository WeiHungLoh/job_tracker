import { screen, within } from '@testing-library/react';
import ApplicationPipelineChart from '../../pages/dashboard/ApplicationPipelineChart';
import ApplicationsLineChart from '../../pages/dashboard/ApplicationsLineChart';
import ClosedOutcomesChart from '../../pages/dashboard/ClosedOutcomesChart';
import DashboardContent from '../../pages/dashboard/DashboardContent';
import DashboardStats from '../../pages/dashboard/DashboardStats';
import UpcomingInterviews from '../../pages/dashboard/UpcomingInterviews';
import type { JobStatusCount, WeeklyApplicationCount } from '../../pages/dashboard/models';
import type { JobInterview } from '../../pages/interview/models';
import { render } from '../renderWithToast';

vi.mock('react-chartjs-2', () => ({
    Bar: ({ data }: { data: { labels?: unknown[]; datasets?: Array<{ data?: unknown[] }> } }) => (
        <div data-testid='bar-chart'>
            {data.labels?.map((label, index) => (
                <span key={`${String(label)}-${index}`}>
                    {String(label)}: {String(data.datasets?.[0]?.data?.[index])}
                </span>
            ))}
        </div>
    ),
    Line: () => <div data-testid='line-chart'>Application trend line chart</div>,
}));

const fixedNow = new Date('2026-07-10T12:00:00.000Z');

const createInterview = (interviewId: number, interviewDate: string, companyName: string): JobInterview => ({
    interview_id: interviewId,
    job_id: interviewId,
    company_name: companyName,
    job_title: `Role ${interviewId}`,
    interview_date: interviewDate,
    interview_location: interviewId % 2 === 0 ? 'Video call' : '',
    interview_type: interviewId % 2 === 0 ? 'Technical interview' : '',
    interview_notes: '',
});

const statusCount = (jobStatus: JobStatusCount['job_status'], count: number): JobStatusCount => ({
    job_status: jobStatus,
    count: String(count),
});

describe('Dashboard V2', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('renders all dashboard sections', () => {
        render(
            <DashboardContent
                statusCounts={[statusCount('Applied', 4), statusCount('Rejected', 1)]}
                interviews={[]}
                weeklyApplications={[{ start_of_week: '2026-07-06', applications_count: '4' }]}
                isLoading={false}
            />
        );

        expect(screen.getByText('Total Applications')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Application Trend' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Upcoming Interviews' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Application Pipeline' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Closed Outcomes' })).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
    });

    test('shows this week, comparison, and best-week trend values', () => {
        const weeklyApplications: WeeklyApplicationCount[] = [
            { start_of_week: '2026-06-29', applications_count: '2' },
            { start_of_week: '2026-07-06', applications_count: '5' },
        ];

        render(<ApplicationsLineChart weeklyApplications={weeklyApplications} isLoading={false} />);

        const summary = screen.getByLabelText('Weekly application summary');
        expect(within(summary).getByText('This week').parentElement).toHaveTextContent('5');
        expect(within(summary).getByText('Change').parentElement).toHaveTextContent('+3 vs last week');
        expect(within(summary).getByText('Best week').parentElement).toHaveTextContent('5');
        expect(screen.getByText('Total applications in the past eight weeks: 7')).toBeInTheDocument();
    });

    test('uses the safe trend fallback when there is no previous week', () => {
        render(
            <ApplicationsLineChart
                weeklyApplications={[{ start_of_week: '2026-07-06', applications_count: '3' }]}
                isLoading={false}
            />
        );

        expect(screen.getByText('No previous week data')).toBeInTheDocument();
    });

    test('keeps pipeline statuses ordered, fills missing counts, and excludes closed statuses', () => {
        render(
            <ApplicationPipelineChart
                statusCounts={[statusCount('Rejected', 2), statusCount('Applied', 5)]}
                isLoading={false}
            />
        );

        const chart = screen.getByTestId('bar-chart');
        expect(
            within(chart)
                .getAllByText(/:/)
                .map((row) => row.textContent)
        ).toEqual(['Applied: 5', 'Interview: 0', 'Offer: 0', 'Accepted: 0']);
        expect(chart).not.toHaveTextContent('Rejected');
        expect(chart).not.toHaveTextContent('Ghosted');
        expect(chart).not.toHaveTextContent('Declined');
        expect(
            within(screen.getByRole('list', { name: 'Application pipeline legend' }))
                .getAllByRole('listitem')
                .map((item) => item.textContent)
        ).toEqual(['Applied', 'Interview', 'Offer', 'Accepted']);
    });

    test('shows closed outcomes with missing statuses as zero', () => {
        render(<ClosedOutcomesChart statusCounts={[statusCount('Rejected', 2)]} isLoading={false} />);

        expect(
            within(screen.getByTestId('bar-chart'))
                .getAllByText(/:/)
                .map((row) => row.textContent)
        ).toEqual(['Rejected: 2', 'Ghosted: 0', 'Declined: 0']);
        expect(
            within(screen.getByRole('list', { name: 'Closed outcomes legend' }))
                .getAllByRole('listitem')
                .map((item) => item.textContent)
        ).toEqual(['Rejected', 'Ghosted', 'Declined']);
    });

    test('keeps the zero-value pipeline visible when applications only have closed statuses', () => {
        render(<ApplicationPipelineChart statusCounts={[statusCount('Rejected', 2)]} isLoading={false} />);

        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        expect(screen.queryByText('No job applications found.')).not.toBeInTheDocument();
    });

    test('shows the closed-outcomes empty state when all closed counts are zero', () => {
        render(<ClosedOutcomesChart statusCounts={[statusCount('Applied', 3)]} isLoading={false} />);

        expect(screen.getByText('No closed outcomes yet.')).toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    test('shows only the three nearest future interviews in order', () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);

        const interviews = [
            createInterview(1, '2026-07-09T12:00:00.000Z', 'Past Company'),
            createInterview(2, '2026-07-14T12:00:00.000Z', 'Fourth Company'),
            createInterview(3, '2026-07-11T12:00:00.000Z', 'First Company'),
            createInterview(4, '2026-07-13T12:00:00.000Z', 'Third Company'),
            createInterview(5, '2026-07-12T12:00:00.000Z', 'Second Company'),
        ];

        render(<UpcomingInterviews interviews={interviews} isLoading={false} />);

        expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
            'First Company',
            'Second Company',
            'Third Company',
        ]);
        expect(
            within(screen.getByRole('list', { name: 'Upcoming interviews list' }))
                .getAllByRole('listitem')
                .map((item) => item.querySelector('[aria-hidden="true"]')?.textContent)
        ).toEqual(['1', '2', '3']);
        expect(screen.queryByText('Past Company')).not.toBeInTheDocument();
        expect(screen.queryByText('Fourth Company')).not.toBeInTheDocument();
    });

    test('shows the upcoming-interviews empty state when no future interviews exist', () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);

        render(
            <UpcomingInterviews
                interviews={[createInterview(1, '2026-07-09T12:00:00.000Z', 'Past Company')]}
                isLoading={false}
            />
        );

        expect(screen.getByRole('heading', { name: 'No upcoming interviews' })).toBeInTheDocument();
        expect(screen.getByText('Interviews you add will appear here.')).toBeInTheDocument();
    });

    test('shows current-state interview and offer rates', () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);

        render(
            <DashboardStats
                statusCounts={[
                    statusCount('Applied', 4),
                    statusCount('Interview', 2),
                    statusCount('Offer', 1),
                    statusCount('Accepted', 1),
                    statusCount('Declined', 2),
                ]}
                interviews={[
                    createInterview(1, '2026-07-09T12:00:00.000Z', 'Past Company'),
                    createInterview(2, '2026-07-11T12:00:00.000Z', 'Future Company'),
                ]}
                weeklyApplications={[{ start_of_week: '2026-07-06', applications_count: '4' }]}
                isLoading={false}
            />
        );

        expect(screen.getByText('Total Applications').parentElement).toHaveTextContent('10');
        expect(screen.getByText('Applied This Week').parentElement).toHaveTextContent('4');
        expect(screen.getByText('Upcoming Interviews').parentElement).toHaveTextContent('1');
        expect(screen.getByText('Interview Rate').parentElement).toHaveTextContent('60%');
        expect(screen.getByText('Offer Rate').parentElement).toHaveTextContent('40%');
    });

    test('shows unavailable rates when there are no applications', () => {
        render(<DashboardStats statusCounts={[]} interviews={[]} weeklyApplications={[]} isLoading={false} />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });
});
