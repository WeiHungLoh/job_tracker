import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { useEffect, useMemo, useRef } from 'react';
import formatDate from '../../helper/dateFormatter';
import { Line } from 'react-chartjs-2';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import styles from './ApplicationsLineChart.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useTheme } from '../../components/theme/ThemeContext';
import { useChartData } from './useChartData';
import { LEGEND_LABELS, TITLE_FONT, TITLE_PADDING } from './chartConfig';

ChartJS.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Title, Tooltip);

const LINE_COLOR = { bg: '#17a2b8', border: '#17a2b8' };

const THEME_TEXT = {
    light: { title: '#343a40', tick: '#666', grid: 'rgba(0,0,0,0.1)', legend: '#343a40' },
    dark: { title: '#dee2e6', tick: '#adb5bd', grid: 'rgba(255,255,255,0.12)', legend: '#dee2e6' },
} as const;

const ApplicationsLineChart = () => {
    const api = useJobTrackerAPI();
    const { data: applications, isLoading } = useChartData(() => api.application.listWeeklyApplications());
    const { theme } = useTheme();
    const chartRef = useRef<ChartJS<'line'>>(null);

    const byWeek = useMemo(() => {
        const acc: Record<string, string> = {};
        for (const row of applications) {
            acc[row.start_of_week] = row.applications_count;
        }
        return acc;
    }, [applications]);

    const total = useMemo(() => {
        return Object.values(byWeek).reduce((sum, v) => sum + parseInt(v), 0);
    }, [byWeek]);

    const data = useMemo(() => {
        return {
            labels: Object.keys(byWeek).map((d) => formatDate(d).formattedDay),
            datasets: [{ label: 'Applications Applied', data: Object.values(byWeek), ...LINE_COLOR }],
        };
    }, [byWeek]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) {
            return;
        }

        const c = THEME_TEXT[theme];
        const opts = chart.options;

        if (opts.scales?.x?.ticks) {
            opts.scales.x.ticks.color = c.tick;
        }
        if (opts.scales?.x?.grid) {
            opts.scales.x.grid.color = c.grid;
        }
        if (opts.scales?.y?.ticks) {
            opts.scales.y.ticks.color = c.tick;
        }
        if (opts.scales?.y?.grid) {
            opts.scales.y.grid.color = c.grid;
        }
        if (opts.plugins?.legend?.labels) {
            opts.plugins.legend.labels.color = c.legend;
        }
        if (opts.plugins?.title) {
            opts.plugins.title.color = c.title;
        }

        chart.data.datasets.forEach(function (ds) {
            ds.backgroundColor = LINE_COLOR.bg;
            ds.borderColor = LINE_COLOR.border;
        });

        chart.update();
    }, [theme, data]);

    if (isLoading) {
        return <LoadingSpinner size='sm' />;
    }

    if (total === 0) {
        return (
            <div className={styles.noApplicationMessage}>
                No job applications applied in the last eight weeks. Start adding some to see your progress
                here!
            </div>
        );
    }

    return (
        <div className={styles.applicationLineChart}>
            <Line
                ref={chartRef}
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: {}, grid: {} },
                        y: { ticks: {}, grid: {} },
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Application Trend Over the Past 8 Weeks',
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
            <div className={styles.application}>
                Total Applications Applied in the Past Eight Weeks: {total}
            </div>
        </div>
    );
};

export default ApplicationsLineChart;
