import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import styles from './JobStatusChart.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useTheme } from '../../components/theme/ThemeContext';
import { useChartData } from './useChartData';
import { BASE_OPTIONS, LEGEND_LABELS, TITLE_FONT, TITLE_PADDING } from './chartConfig';
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

const JobStatusChart = () => {
    const api = useJobTrackerAPI();
    const { data: applications, isLoading } = useChartData(() => api.application.listJobStatusCounts());
    const { theme } = useTheme();
    const chartRef = useRef<ChartJS<'pie'>>(null);

    const statuses = useMemo(() => {
        return applications.map((a) => a.job_status);
    }, [applications]);

    const counts = useMemo(() => {
        return applications.map((a) => a.count);
    }, [applications]);

    const total = useMemo(() => {
        return counts.reduce((s, v) => s + parseInt(v), 0);
    }, [counts]);

    const data = useMemo(() => {
        return {
            labels: statuses,
            datasets: [
                {
                    label: '# of applications',
                    data: counts,
                    backgroundColor: statuses.map((s) => STATUS_COLOR[s][theme]),
                    borderColor: statuses.map((s) => STATUS_COLOR[s][theme]),
                    borderWidth: 0.7,
                    hoverOffset: 60,
                },
            ],
        };
    }, [statuses, counts, theme]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) {
            return;
        }

        const c = TEXT_COLOR[theme];
        const opts = chart.options;

        if (opts.plugins?.legend?.labels) {
            opts.plugins.legend.labels.color = c.legend;
        }
        if (opts.plugins?.title) {
            opts.plugins.title.color = c.title;
        }

        chart.data.datasets.forEach(function (ds) {
            ds.backgroundColor = statuses.map((s) => STATUS_COLOR[s][theme]);
            ds.borderColor = statuses.map((s) => STATUS_COLOR[s][theme]);
        });

        chart.update();
    }, [theme, data, statuses]);

    if (isLoading) {
        return <LoadingSpinner size='sm' />;
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
                ref={chartRef}
                data={data}
                options={{
                    ...BASE_OPTIONS,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Application Status Overview',
                            font: TITLE_FONT,
                            padding: TITLE_PADDING,
                        },
                        legend: {
                            position: 'bottom' as const,
                            labels: LEGEND_LABELS,
                        },
                    },
                }}
            />
            <div className={styles.application}>Total Applications Applied: {total}</div>
        </div>
    );
};

export default JobStatusChart;
