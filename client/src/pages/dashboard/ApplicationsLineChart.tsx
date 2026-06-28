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
import { useMemo } from 'react';
import formatDate from '../../helper/dateFormatter';
import { Line } from 'react-chartjs-2';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import type { ApplicationsLineChartProps } from './models';
import styles from './ApplicationsLineChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';
import { LEGEND_LABELS, TITLE_FONT, TITLE_PADDING } from './chartConfig';

ChartJS.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Title, Tooltip);

const LINE_COLOR = {
    light: { backgroundColor: '#17a2b8', borderColor: '#17a2b8' },
    dark: { backgroundColor: '#148f9e', borderColor: '#148f9e' },
} as const;

const THEME_TEXT = {
    light: { title: '#343a40', tick: '#666', grid: 'rgba(0,0,0,0.1)', legend: '#343a40' },
    dark: { title: '#dee2e6', tick: '#adb5bd', grid: 'rgba(255,255,255,0.12)', legend: '#dee2e6' },
} as const;

const ApplicationsLineChart = ({ weeklyApplications, isLoading }: ApplicationsLineChartProps) => {
    const { theme } = useTheme();

    const byWeek = useMemo(() => {
        const applicationsByWeek: Record<string, string> = {};
        for (const weeklyApplication of weeklyApplications) {
            applicationsByWeek[weeklyApplication.start_of_week] = weeklyApplication.applications_count;
        }
        return applicationsByWeek;
    }, [weeklyApplications]);

    const total = useMemo(() => {
        return Object.values(byWeek).reduce((sum, count) => sum + Number(count), 0);
    }, [byWeek]);

    const data = useMemo(() => {
        return {
            labels: Object.keys(byWeek).map((date) => formatDate(date).formattedDay),
            datasets: [{ label: 'Applications Applied', data: Object.values(byWeek), ...LINE_COLOR[theme] }],
        };
    }, [byWeek, theme]);

    const chartColors = THEME_TEXT[theme];

    if (isLoading) {
        return <LoadingSpinner size='sm' />;
    }

    if (total === 0) {
        return (
            <div className={styles.noApplicationMessage}>
                No job applications applied in the last eight weeks. Start adding some to see your progress here!
            </div>
        );
    }

    return (
        <div className={styles.applicationLineChart}>
            <Line
                key={theme}
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } },
                        y: { ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } },
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Application Trend Over the Past 8 Weeks',
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
            <div className={styles.application}>Total Applications Applied in the Past Eight Weeks: {total}</div>
        </div>
    );
};

export default ApplicationsLineChart;
