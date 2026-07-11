import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import DashboardCard from './DashboardCard';
import LoadingSpinner from '../../components/loadingSpinner/LoadingSpinner';
import StatusLegend from './StatusLegend';
import type { JobStatus } from '../application/models';
import type { StatusChartProps } from './models';
import { createStatusBarChartData, createStatusBarChartOptions, statusBarTooltipPlugin } from './chartConfig';
import { getStatusCountMap } from './dashboardData';
import styles from './ApplicationPipelineChart.module.css';
import { useTheme } from '../../components/theme/ThemeContext';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const PIPELINE_STATUSES: readonly JobStatus[] = ['Applied', 'Interview', 'Offer', 'Accepted'];

const ApplicationPipelineChart = ({ statusCounts, isLoading }: StatusChartProps) => {
    const { theme } = useTheme();
    const countByStatus = useMemo(() => getStatusCountMap(statusCounts), [statusCounts]);
    const renderedStatuses = useMemo(
        () => PIPELINE_STATUSES.filter((status) => (countByStatus[status] ?? 0) > 0),
        [countByStatus]
    );
    const data = useMemo(
        () => createStatusBarChartData(renderedStatuses, countByStatus, theme),
        [countByStatus, renderedStatuses, theme]
    );
    const options = useMemo(() => createStatusBarChartOptions(theme), [theme]);
    const chartLabel = renderedStatuses.map((status) => `${status}: ${countByStatus[status] ?? 0}`).join(', ');

    return (
        <DashboardCard title='Application Pipeline' description='Current progression from Applied to Accepted.'>
            {isLoading ? (
                <div className={styles.centered}>
                    <LoadingSpinner size='sm' />
                </div>
            ) : renderedStatuses.length === 0 ? (
                <p className={styles.centered}>No applications in the pipeline yet.</p>
            ) : (
                <>
                    <div className={styles.chartArea} role='img' aria-label={`Application pipeline. ${chartLabel}`}>
                        <Bar key={theme} data={data} options={options} plugins={[statusBarTooltipPlugin]} />
                    </div>
                    <StatusLegend label='Application pipeline legend' statuses={renderedStatuses} />
                </>
            )}
        </DashboardCard>
    );
};

export default ApplicationPipelineChart;
