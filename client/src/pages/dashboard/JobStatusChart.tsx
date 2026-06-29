import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import type { JobStatusChartProps } from './models';
import styles from './JobStatusChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';
import { LEGEND_LABELS, TITLE_FONT, TITLE_PADDING } from './chartConfig';
import type { JobStatus } from '../jobApplication/models';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const STATUS_COLOR: Record<JobStatus, { light: string; dark: string }> = {
    Accepted: { light: '#198754', dark: '#146c43' },
    Applied: { light: '#17a2b8', dark: '#148f9e' },
    Declined: { light: 'rebeccapurple', dark: '#663399' },
    Ghosted: { light: '#6c757d', dark: '#5c636a' },
    Interview: { light: '#0d6efd', dark: '#0a58ca' },
    Offer: { light: '#ffc107', dark: '#d39e00' },
    Rejected: { light: '#dc3545', dark: '#b02a37' },
};

const TEXT_COLOR = {
    light: { title: '#343a40', legend: '#343a40' },
    dark: { title: '#dee2e6', legend: '#dee2e6' },
} as const;

const JobStatusChart = ({ statusCounts, isLoading }: JobStatusChartProps) => {
    const { theme } = useTheme();

    const statuses = useMemo(() => {
        return statusCounts.map((statusCount) => statusCount.job_status);
    }, [statusCounts]);

    const counts = useMemo(() => {
        return statusCounts.map((statusCount) => statusCount.count);
    }, [statusCounts]);

    const total = useMemo(() => {
        return counts.reduce((sum, count) => sum + Number(count), 0);
    }, [counts]);

    const data = useMemo(() => {
        return {
            labels: statuses,
            datasets: [
                {
                    label: '# of applications',
                    data: counts,
                    backgroundColor: statuses.map((status) => STATUS_COLOR[status][theme]),
                    borderColor: statuses.map((status) => STATUS_COLOR[status][theme]),
                    borderWidth: 0.7,
                    hoverOffset: 60,
                },
            ],
        };
    }, [statuses, counts, theme]);

    const chartColors = TEXT_COLOR[theme];

    if (isLoading) {
        return (
            <div className={styles.loadingChart}>
                <LoadingSpinner size='sm' />
            </div>
        );
    }

    if (total === 0) {
        return (
            <div className={styles.noApplicationMessage}>
                No job applications found. Start adding one now to see your application status breakdown!
            </div>
        );
    }

    return (
        <div className={styles.jobStatusChart}>
            <Pie
                key={theme}
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Application Status Overview',
                            font: TITLE_FONT,
                            padding: TITLE_PADDING,
                            color: chartColors.title,
                        },
                        legend: {
                            position: 'bottom' as const,
                            labels: { ...LEGEND_LABELS, color: chartColors.legend },
                        },
                    },
                }}
            />
            <div className={styles.application}>Total Applications Applied: {total}</div>
        </div>
    );
};

export default JobStatusChart;
