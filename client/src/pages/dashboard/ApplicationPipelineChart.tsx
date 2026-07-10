import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import DashboardCard from './DashboardCard';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import StatusLegend from './StatusLegend';
import type { JobStatus } from '../application/models';
import type { StatusChartProps } from './models';
import { createStatusBarChartData, createStatusBarChartOptions } from './chartConfig';
import { getStatusCountMap, getTotalStatusCount } from './dashboardData';
import styles from './ApplicationPipelineChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const PIPELINE_STATUSES: readonly JobStatus[] = ['Applied', 'Interview', 'Offer', 'Accepted'];

const ApplicationPipelineChart = ({ statusCounts, isLoading }: StatusChartProps) => {
    const { theme } = useTheme();
    const countByStatus = useMemo(() => getStatusCountMap(statusCounts), [statusCounts]);
    const total = useMemo(() => getTotalStatusCount(countByStatus), [countByStatus]);
    const data = useMemo(
        () => createStatusBarChartData(PIPELINE_STATUSES, countByStatus, theme),
        [countByStatus, theme]
    );
    const options = useMemo(() => createStatusBarChartOptions(theme), [theme]);
    const chartLabel = PIPELINE_STATUSES.map((status) => `${status}: ${countByStatus[status] ?? 0}`).join(', ');

    return (
        <DashboardCard title='Application Pipeline' description='Current progression from Applied to Accepted.'>
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : total === 0 ? (
                <p className={styles.centered}>No job applications found.</p>
            ) : (
                <>
                    <div className={styles.chartArea} role='img' aria-label={`Application pipeline. ${chartLabel}`}>
                        <Bar key={theme} data={data} options={options} />
                    </div>
                    <StatusLegend label='Application pipeline legend' statuses={PIPELINE_STATUSES} />
                </>
            )}
        </DashboardCard>
    );
};

export default ApplicationPipelineChart;
