import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import DashboardCard from './DashboardCard';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import StatusLegend from './StatusLegend';
import type { JobStatus } from '../application/models';
import type { StatusChartProps } from './models';
import { createStatusBarChartData, createStatusBarChartOptions } from './chartConfig';
import { getStatusCountMap } from './dashboardData';
import styles from './ClosedOutcomesChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const CLOSED_STATUSES: readonly JobStatus[] = ['Rejected', 'Ghosted', 'Declined'];

const ClosedOutcomesChart = ({ statusCounts, isLoading }: StatusChartProps) => {
    const { theme } = useTheme();
    const countByStatus = useMemo(() => getStatusCountMap(statusCounts), [statusCounts]);
    const closedTotal = CLOSED_STATUSES.reduce((total, status) => total + (countByStatus[status] ?? 0), 0);
    const data = useMemo(() => createStatusBarChartData(CLOSED_STATUSES, countByStatus, theme), [countByStatus, theme]);
    const options = useMemo(() => createStatusBarChartOptions(theme), [theme]);
    const chartLabel = CLOSED_STATUSES.map((status) => `${status}: ${countByStatus[status] ?? 0}`).join(', ');

    return (
        <DashboardCard title='Closed Outcomes' description='Applications that are no longer active.'>
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : closedTotal === 0 ? (
                <p className={styles.centered}>No closed outcomes yet.</p>
            ) : (
                <>
                    <div className={styles.chartArea} role='img' aria-label={`Closed outcomes. ${chartLabel}`}>
                        <Bar key={theme} data={data} options={options} />
                    </div>
                    <StatusLegend label='Closed outcomes legend' statuses={CLOSED_STATUSES} />
                </>
            )}
        </DashboardCard>
    );
};

export default ClosedOutcomesChart;
