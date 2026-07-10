import type { ChartData, ChartOptions } from 'chart.js';
import type { Theme } from '../../components/theme/models';
import type { JobStatus } from '../application/models';
import type { StatusCountMap } from './dashboardData';

export const TITLE_FONT = { size: 16, weight: 'bold' } as const;
export const TITLE_PADDING = { top: 20, bottom: 20 };
export const LEGEND_LABELS = {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    padding: 20,
    font: { size: 14 },
};

export const CHART_COLORS = {
    light: { title: '#343a40', tick: '#666', grid: 'rgba(0,0,0,0.1)', legend: '#343a40' },
    dark: { title: '#dee2e6', tick: '#adb5bd', grid: 'rgba(255,255,255,0.12)', legend: '#dee2e6' },
} as const;

export const STATUS_COLORS: Record<JobStatus, { light: string; dark: string }> = {
    Accepted: { light: '#198754', dark: '#146c43' },
    Applied: { light: '#17a2b8', dark: '#148f9e' },
    Declined: { light: 'rebeccapurple', dark: '#663399' },
    Ghosted: { light: '#6c757d', dark: '#5c636a' },
    Interview: { light: '#0d6efd', dark: '#0a58ca' },
    Offer: { light: '#ffc107', dark: '#d39e00' },
    Rejected: { light: '#dc3545', dark: '#b02a37' },
};

export const createStatusBarChartData = (
    statuses: readonly JobStatus[],
    countByStatus: StatusCountMap,
    theme: Theme
): ChartData<'bar'> => ({
    labels: [...statuses],
    datasets: [
        {
            label: 'Applications',
            data: statuses.map((status) => countByStatus[status] ?? 0),
            backgroundColor: statuses.map((status) => STATUS_COLORS[status][theme]),
            borderColor: statuses.map((status) => STATUS_COLORS[status][theme]),
            borderWidth: 1,
            borderRadius: 4,
        },
    ],
});

export const createStatusBarChartOptions = (theme: Theme): ChartOptions<'bar'> => {
    const colors = CHART_COLORS[theme];

    return {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                beginAtZero: true,
                ticks: { color: colors.tick, precision: 0 },
                grid: { color: colors.grid },
            },
            y: {
                ticks: { color: colors.tick },
                grid: { display: false },
            },
        },
        plugins: {
            legend: { display: false },
        },
    };
};
