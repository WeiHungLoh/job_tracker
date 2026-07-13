import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChartOptions, Plugin } from 'chart.js';
import ApplicationPipelineChart from '../../pages/dashboard/ApplicationPipelineChart';
import ApplicationsLineChart from '../../pages/dashboard/ApplicationsLineChart';
import ClosedOutcomesChart from '../../pages/dashboard/ClosedOutcomesChart';
import DashboardContent from '../../pages/dashboard/DashboardContent';
import DashboardStats from '../../pages/dashboard/DashboardStats';
import UpcomingInterviews from '../../pages/dashboard/UpcomingInterviews';
import type { JobStatusCount, WeeklyApplicationCount } from '../../pages/dashboard/models';
import type { JobInterview } from '../../pages/interview/models';
import { getStatusBarTooltipPlacement, getTrendTooltipPlacement } from '../../pages/dashboard/chartConfig';
import { render } from '../renderWithToast';

const chartMocks = vi.hoisted(() => ({
    barOptions: undefined as ChartOptions<'bar'> | undefined,
    barPlugins: undefined as Plugin<'bar'>[] | undefined,
    lineOptions: undefined as ChartOptions<'line'> | undefined,
    linePlugins: undefined as Plugin<'line'>[] | undefined,
}));

vi.mock('react-chartjs-2', () => ({
    Bar: ({
        data,
        options,
        plugins,
    }: {
        data: { labels?: unknown[]; datasets?: Array<{ data?: unknown[] }> };
        options?: ChartOptions<'bar'>;
        plugins?: Plugin<'bar'>[];
    }) => {
        chartMocks.barOptions = options;
        chartMocks.barPlugins = plugins;

        return (
            <div data-testid='bar-chart'>
                {data.labels?.map((label, index) => (
                    <span key={`${String(label)}-${index}`}>
                        {String(label)}: {String(data.datasets?.[0]?.data?.[index])}
                    </span>
                ))}
            </div>
        );
    },
    Line: ({ options, plugins }: { options?: ChartOptions<'line'>; plugins?: Plugin<'line'>[] }) => {
        chartMocks.lineOptions = options;
        chartMocks.linePlugins = plugins;
        return <div data-testid='line-chart'>Application trend line chart</div>;
    },
}));

const fixedNow = new Date('2026-07-10T12:00:00.000Z');
const chartArea = { left: 20, top: 10, right: 320, bottom: 210, width: 300, height: 200 };

const createInterview = (interviewId: number, interviewDate: string, companyName: string): JobInterview => ({
    interview_id: interviewId,
    job_id: interviewId,
    company_name: companyName,
    job_title: `Role ${interviewId}`,
    interview_date: interviewDate,
    interview_duration_minutes: 60,
    interview_location: interviewId % 2 === 0 ? 'Video call' : '',
    interview_type: interviewId % 2 === 0 ? 'Technical interview' : '',
    interview_notes: '',
});

const statusCount = (jobStatus: JobStatusCount['job_status'], count: number): JobStatusCount => ({
    job_status: jobStatus,
    count: String(count),
});

const getRenderedBars = (): Array<string | null> =>
    within(screen.getByTestId('bar-chart'))
        .getAllByText(/:/)
        .map((row) => row.textContent);

const getLegendStatuses = (label: string): Array<string | null> =>
    within(screen.getByRole('list', { name: label }))
        .getAllByRole('listitem')
        .map((item) => item.textContent);

describe('Dashboard V2', () => {
    afterEach(() => {
        vi.useRealTimers();
        chartMocks.barOptions = undefined;
        chartMocks.barPlugins = undefined;
        chartMocks.lineOptions = undefined;
        chartMocks.linePlugins = undefined;
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

        expect(screen.getByText('Total Active Applications')).toBeInTheDocument();
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

    test('renders only one positive pipeline status in the chart, legend, and accessible label', () => {
        render(
            <ApplicationPipelineChart
                statusCounts={[statusCount('Applied', 5), statusCount('Interview', 0), statusCount('Rejected', 2)]}
                isLoading={false}
            />
        );

        expect(getRenderedBars()).toEqual(['Applied: 5']);
        expect(getLegendStatuses('Application pipeline legend')).toEqual(['Applied']);
        expect(screen.getByRole('img', { name: 'Application pipeline. Applied: 5' })).toBeInTheDocument();
        expect(chartMocks.barPlugins?.map((plugin) => plugin.id)).toContain('statusBarTooltipPositioning');
        expect(chartMocks.barOptions?.plugins?.tooltip).toEqual(
            expect.objectContaining({ animation: false, caretPadding: 6, caretSize: 5 })
        );
    });

    test('preserves pipeline order while excluding zero and closed statuses everywhere', () => {
        render(
            <ApplicationPipelineChart
                statusCounts={[
                    statusCount('Accepted', 2),
                    statusCount('Offer', 0),
                    statusCount('Rejected', 4),
                    statusCount('Interview', 3),
                    statusCount('Applied', 1),
                ]}
                isLoading={false}
            />
        );

        expect(getRenderedBars()).toEqual(['Applied: 1', 'Interview: 3', 'Accepted: 2']);
        expect(getLegendStatuses('Application pipeline legend')).toEqual(['Applied', 'Interview', 'Accepted']);
        expect(
            screen.getByRole('img', {
                name: 'Application pipeline. Applied: 1, Interview: 3, Accepted: 2',
            })
        ).toBeInTheDocument();
    });

    test('selects every pipeline status from the accessible legend and Chart.js bar handler', async () => {
        const onStatusSelect = vi.fn();
        render(
            <ApplicationPipelineChart
                statusCounts={[
                    statusCount('Applied', 1),
                    statusCount('Interview', 2),
                    statusCount('Offer', 3),
                    statusCount('Accepted', 4),
                ]}
                isLoading={false}
                onStatusSelect={onStatusSelect}
            />
        );

        for (const status of ['Applied', 'Interview', 'Offer', 'Accepted']) {
            await userEvent.click(screen.getByRole('button', { name: `View ${status} applications` }));
        }
        expect(onStatusSelect.mock.calls.map(([status]) => status)).toEqual([
            'Applied',
            'Interview',
            'Offer',
            'Accepted',
        ]);

        chartMocks.barOptions?.onClick?.(
            {} as never,
            [{ index: 2 }] as never,
            { data: { labels: ['Applied', 'Interview', 'Offer', 'Accepted'] } } as never
        );
        expect(onStatusSelect).toHaveBeenLastCalledWith('Offer');

        onStatusSelect.mockClear();
        chartMocks.barOptions?.onClick?.({} as never, [], {
            data: { labels: ['Applied', 'Interview', 'Offer', 'Accepted'] },
        } as never);
        expect(onStatusSelect).not.toHaveBeenCalled();
    });

    test('shows the pipeline empty state when every pipeline count is zero', () => {
        render(
            <ApplicationPipelineChart
                statusCounts={[
                    statusCount('Applied', 0),
                    statusCount('Interview', 0),
                    statusCount('Offer', 0),
                    statusCount('Accepted', 0),
                ]}
                isLoading={false}
            />
        );

        expect(screen.getByText('No applications in the pipeline yet.')).toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Application pipeline legend' })).not.toBeInTheDocument();
    });

    test('uses only pipeline statuses to decide whether the pipeline has data', () => {
        render(
            <ApplicationPipelineChart
                statusCounts={[statusCount('Rejected', 2), statusCount('Ghosted', 1)]}
                isLoading={false}
            />
        );

        expect(screen.getByText('No applications in the pipeline yet.')).toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    test('renders only one positive closed status in the chart, legend, and accessible label', () => {
        render(
            <ClosedOutcomesChart
                statusCounts={[statusCount('Rejected', 2), statusCount('Ghosted', 0), statusCount('Applied', 5)]}
                isLoading={false}
            />
        );

        expect(getRenderedBars()).toEqual(['Rejected: 2']);
        expect(getLegendStatuses('Closed outcomes legend')).toEqual(['Rejected']);
        expect(screen.getByRole('img', { name: 'Closed outcomes. Rejected: 2' })).toBeInTheDocument();
    });

    test('preserves closed-status order while excluding zero and pipeline statuses everywhere', () => {
        render(
            <ClosedOutcomesChart
                statusCounts={[
                    statusCount('Declined', 1),
                    statusCount('Applied', 4),
                    statusCount('Ghosted', 0),
                    statusCount('Rejected', 3),
                ]}
                isLoading={false}
            />
        );

        expect(getRenderedBars()).toEqual(['Rejected: 3', 'Declined: 1']);
        expect(getLegendStatuses('Closed outcomes legend')).toEqual(['Rejected', 'Declined']);
        expect(screen.getByRole('img', { name: 'Closed outcomes. Rejected: 3, Declined: 1' })).toBeInTheDocument();
    });

    test('selects every closed status from the accessible legend', async () => {
        const onStatusSelect = vi.fn();
        render(
            <ClosedOutcomesChart
                statusCounts={[statusCount('Rejected', 1), statusCount('Ghosted', 2), statusCount('Declined', 3)]}
                isLoading={false}
                onStatusSelect={onStatusSelect}
            />
        );

        for (const status of ['Rejected', 'Ghosted', 'Declined']) {
            await userEvent.click(screen.getByRole('button', { name: `View ${status} applications` }));
        }
        expect(onStatusSelect.mock.calls.map(([status]) => status)).toEqual(['Rejected', 'Ghosted', 'Declined']);
    });

    test('shows the closed-outcomes empty state when all closed counts are zero', () => {
        render(
            <ClosedOutcomesChart
                statusCounts={[
                    statusCount('Rejected', 0),
                    statusCount('Ghosted', 0),
                    statusCount('Declined', 0),
                    statusCount('Applied', 3),
                ]}
                isLoading={false}
            />
        );

        expect(screen.getByText('No closed outcomes yet.')).toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Closed outcomes legend' })).not.toBeInTheDocument();
    });

    test('places status tooltips to the right with a left-facing caret when space allows', () => {
        expect(getStatusBarTooltipPlacement({ x: 100, y: 60 }, { width: 80, height: 40 }, chartArea)).toEqual({
            x: 111,
            y: 40,
            xAlign: 'left',
            yAlign: 'center',
        });
    });

    test('falls status tooltips back to the left and keeps first and last bars within the chart area', () => {
        expect(getStatusBarTooltipPlacement({ x: 300, y: 205 }, { width: 80, height: 40 }, chartArea)).toEqual({
            x: 209,
            y: 170,
            xAlign: 'right',
            yAlign: 'center',
        });
        expect(getStatusBarTooltipPlacement({ x: 40, y: 12 }, { width: 80, height: 40 }, chartArea).y).toBe(10);
    });

    test('places trend tooltips above with a downward-facing caret when space allows', () => {
        expect(getTrendTooltipPlacement({ x: 150, y: 100 }, { width: 80, height: 30 }, chartArea)).toEqual({
            x: 110,
            y: 59,
            xAlign: 'center',
            yAlign: 'bottom',
        });
    });

    test('falls trend tooltips back to the left when above would overflow and clamps edge points', () => {
        expect(getTrendTooltipPlacement({ x: 280, y: 40 }, { width: 80, height: 40 }, chartArea)).toEqual({
            x: 189,
            y: 20,
            xAlign: 'right',
            yAlign: 'center',
        });
        expect(getTrendTooltipPlacement({ x: 25, y: 100 }, { width: 80, height: 30 }, chartArea)).toEqual({
            x: 20,
            y: 85,
            xAlign: 'right',
            yAlign: 'center',
        });
        expect(getTrendTooltipPlacement({ x: 315, y: 100 }, { width: 80, height: 30 }, chartArea)).toEqual({
            x: 224,
            y: 85,
            xAlign: 'right',
            yAlign: 'center',
        });
    });

    test('keeps the trend legend visible while disabling its dataset toggle', () => {
        render(
            <ApplicationsLineChart
                weeklyApplications={[{ start_of_week: '2026-07-06', applications_count: '3' }]}
                isLoading={false}
            />
        );

        const legendOptions = chartMocks.lineOptions?.plugins?.legend;
        const onLegendClick = legendOptions && legendOptions !== false ? legendOptions.onClick : undefined;
        const chart = { hide: vi.fn(), show: vi.fn() };

        expect(legendOptions).toEqual(expect.objectContaining({ display: true, onClick: expect.any(Function) }));
        expect(chartMocks.linePlugins?.map((plugin) => plugin.id)).toContain('trendTooltipPositioning');
        expect(chartMocks.lineOptions?.plugins?.tooltip).toEqual(
            expect.objectContaining({ animation: false, caretPadding: 6, caretSize: 5 })
        );
        onLegendClick?.({} as never, { datasetIndex: 0 } as never, { chart } as never);

        expect(chart.hide).not.toHaveBeenCalled();
        expect(chart.show).not.toHaveBeenCalled();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('retains the complete dashboard empty state', () => {
        render(<DashboardContent statusCounts={[]} interviews={[]} weeklyApplications={[]} isLoading={false} />);

        expect(
            screen.getByText(
                'No job applications applied in the last eight weeks. Start adding some to see your progress here!'
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'No upcoming interviews' })).toBeInTheDocument();
        expect(screen.getByText('No applications in the pipeline yet.')).toBeInTheDocument();
        expect(screen.getByText('No closed outcomes yet.')).toBeInTheDocument();
        expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });

    test('retains the complete dashboard loading state', () => {
        render(
            <DashboardContent
                statusCounts={[statusCount('Applied', 1), statusCount('Rejected', 1)]}
                interviews={[]}
                weeklyApplications={[{ start_of_week: '2026-07-06', applications_count: '1' }]}
                isLoading
            />
        );

        expect(screen.getAllByRole('progressbar', { name: 'Loading' })).toHaveLength(5);
        expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
        expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Weekly application summary')).not.toBeInTheDocument();
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

    test('includes an in-progress interview in the dashboard upcoming collection', () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);

        render(
            <UpcomingInterviews
                interviews={[createInterview(1, '2026-07-10T11:30:00.000Z', 'In Progress Company')]}
                isLoading={false}
            />
        );

        expect(screen.getByRole('heading', { name: 'In Progress Company' })).toBeInTheDocument();
    });

    test('refreshes upcoming interview content when an interview ends while the dashboard remains open', () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);
        const endingInterview = {
            ...createInterview(1, '2026-07-10T11:30:00.000Z', 'Ending Company'),
            interview_duration_minutes: 31,
        };

        render(
            <DashboardContent
                statusCounts={[]}
                interviews={[endingInterview]}
                weeklyApplications={[]}
                isLoading={false}
            />
        );

        const dashboardStatistics = within(screen.getByRole('region', { name: 'Dashboard statistics' }));
        expect(screen.getByRole('heading', { name: 'Ending Company' })).toBeInTheDocument();
        expect(dashboardStatistics.getByText('Upcoming Interviews').parentElement).toHaveTextContent('1');

        act(() => {
            vi.advanceTimersByTime(60 * 1000);
        });

        expect(screen.queryByRole('heading', { name: 'Ending Company' })).not.toBeInTheDocument();
        expect(dashboardStatistics.getByText('Upcoming Interviews').parentElement).toHaveTextContent('0');
    });

    test('selects the exact upcoming interview from its accessible preview', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedNow);
        const onInterviewSelect = vi.fn();
        const interview = createInterview(7, '2026-07-11T12:00:00.000Z', 'Target Company');

        render(<UpcomingInterviews interviews={[interview]} isLoading={false} onInterviewSelect={onInterviewSelect} />);

        screen.getByRole('button', { name: 'View Target Company interview' }).click();
        expect(onInterviewSelect).toHaveBeenCalledWith(7);
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

        expect(screen.getByText('Total Active Applications').parentElement).toHaveTextContent('10');
        expect(screen.getByText('Applied This Week').parentElement).toHaveTextContent('4');
        expect(screen.getByText('Upcoming Interviews').parentElement).toHaveTextContent('1');
        expect(screen.getByText('Interview Rate').parentElement).toHaveTextContent('60%');
        expect(screen.getByText('Offer Rate').parentElement).toHaveTextContent('40%');
    });

    test('reveals and restores only the Interview Rate and Offer Rate calculations', async () => {
        render(
            <DashboardStats
                statusCounts={[statusCount('Applied', 2), statusCount('Interview', 1), statusCount('Offer', 1)]}
                interviews={[]}
                weeklyApplications={[]}
                isLoading={false}
            />
        );

        const interviewRate = screen.getByRole('button', { name: /Interview Rate/i });
        const offerRate = screen.getByRole('button', { name: /Offer Rate/i });

        expect(interviewRate).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('button', { name: /Total Active Applications/i })).not.toBeInTheDocument();

        interviewRate.focus();
        await userEvent.keyboard('{Enter}');
        expect(
            screen.getByText('Interview, Offer, Accepted or Declined applications ÷ total active applications.')
        ).toBeInTheDocument();
        expect(interviewRate).toHaveAttribute('aria-pressed', 'true');

        await userEvent.keyboard(' ');
        expect(screen.getByText('Interview Rate')).toBeInTheDocument();
        expect(interviewRate).toHaveAttribute('aria-pressed', 'false');

        offerRate.focus();
        await userEvent.keyboard('{Enter}');
        expect(
            screen.getByText('Offer, Accepted or Declined applications ÷ total active applications.')
        ).toBeInTheDocument();
        await userEvent.click(offerRate);
        expect(screen.getByText('Offer Rate')).toBeInTheDocument();
    });

    test('shows unavailable rates when there are no applications', () => {
        render(<DashboardStats statusCounts={[]} interviews={[]} weeklyApplications={[]} isLoading={false} />);

        expect(screen.getAllByText('—')).toHaveLength(2);
    });
});
