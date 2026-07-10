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
import DashboardCard from './DashboardCard';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import type { ApplicationsLineChartProps } from './models';
import styles from './ApplicationsLineChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';
import { CHART_COLORS, LEGEND_LABELS, TITLE_FONT, TITLE_PADDING } from './chartConfig';

ChartJS.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Title, Tooltip);

const LINE_COLOR = {
    light: { backgroundColor: '#17a2b8', borderColor: '#17a2b8' },
    dark: { backgroundColor: '#148f9e', borderColor: '#148f9e' },
} as const;

const ApplicationsLineChart = ({ weeklyApplications, isLoading }: ApplicationsLineChartProps) => {
    const { theme } = useTheme();

    const weeks = useMemo(() => {
        return [...weeklyApplications].sort(
            (firstWeek, secondWeek) => Date.parse(firstWeek.start_of_week) - Date.parse(secondWeek.start_of_week)
        );
    }, [weeklyApplications]);

    const counts = useMemo(
        () =>
            weeks.map((week) => {
                const count = Number(week.applications_count);
                return Number.isFinite(count) ? count : 0;
            }),
        [weeks]
    );
    const total = useMemo(() => counts.reduce((sum, count) => sum + count, 0), [counts]);
    const thisWeekCount = counts.at(-1) ?? 0;
    const lastWeekCount = counts.at(-2);
    const difference = lastWeekCount === undefined ? undefined : thisWeekCount - lastWeekCount;
    const comparison =
        difference === undefined
            ? 'No previous week data'
            : difference === 0
            ? 'Same as last week'
            : `${difference > 0 ? '+' : ''}${difference} vs last week`;
    const comparisonClassName =
        difference === undefined || difference === 0
            ? styles.neutral
            : difference > 0
            ? styles.positive
            : styles.negative;
    const bestWeekCount = counts.length > 0 ? Math.max(...counts) : 0;

    const data = useMemo(() => {
        return {
            labels: weeks.map((week) => formatDate(week.start_of_week).formattedDay),
            datasets: [{ label: 'Applications Applied', data: counts, ...LINE_COLOR[theme] }],
        };
    }, [counts, theme, weeks]);

    const chartColors = CHART_COLORS[theme];

    return (
        <DashboardCard title='Application Trend' description='Applications submitted over the past eight weeks.'>
            {!isLoading && (
                <div className={styles.summary} aria-label='Weekly application summary'>
                    <div className={`${styles.summaryItem} ${styles.current}`}>
                        <span>This week</span>
                        <strong>{thisWeekCount}</strong>
                    </div>
                    <div className={`${styles.summaryItem} ${comparisonClassName}`}>
                        <span>Change</span>
                        <strong>{comparison}</strong>
                    </div>
                    <div className={`${styles.summaryItem} ${styles.best}`}>
                        <span>Best week</span>
                        <strong>{bestWeekCount}</strong>
                    </div>
                </div>
            )}
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : total === 0 ? (
                <p className={styles.centered}>
                    No job applications applied in the last eight weeks. Start adding some to see your progress here!
                </p>
            ) : (
                <>
                    <div className={styles.chartArea}>
                        <Line
                            key={theme}
                            data={data}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    x: { ticks: { color: chartColors.tick }, grid: { color: chartColors.grid } },
                                    y: {
                                        beginAtZero: true,
                                        ticks: { color: chartColors.tick, precision: 0 },
                                        grid: { color: chartColors.grid },
                                    },
                                },
                                plugins: {
                                    title: {
                                        display: true,
                                        text: 'Applications by Week',
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
                    </div>
                    <p className={styles.total}>Total applications in the past eight weeks: {total}</p>
                </>
            )}
        </DashboardCard>
    );
};

export default ApplicationsLineChart;
