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
import { useEffect, useState } from 'react';
import type { ChartOptions } from 'chart.js';
import DateFormatter from '../../helper/dateFormatter';
import { Line } from 'react-chartjs-2';
import type { WeeklyApplicationCount } from './models';
import styles from './ApplicationsLineChart.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';

ChartJS.register(CategoryScale, Legend, LineElement, LinearScale, PointElement, Title, Tooltip);

const ApplicationsLineChart = () => {
    const api = useJobTrackerAPI();
    const [applications, setApplications] = useState<WeeklyApplicationCount[]>([]);
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchApplications = async () => {
            try {
                const data = await api.application.listWeeklyApplications();
                if (isActive) setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                showErrorToast((error as Error).message);
            }
        };

        void fetchApplications();
        return () => {
            isActive = false;
        };
    }, []);

    const applicationByWeekCountPair = applications.reduce<Record<string, string>>((acc, row) => {
        acc[row.start_of_week] = row.applications_count;
        return acc;
    }, {});

    const totalApplications = Object.values(applicationByWeekCountPair).reduce((sum, val) => sum + parseInt(val), 0);

    const data = {
        labels: Object.keys(applicationByWeekCountPair).map((date) => DateFormatter(date).formattedDay),
        datasets: [
            {
                label: 'Applications Applied',
                data: Object.values(applicationByWeekCountPair),
                backgroundColor: '#17A2B8',
                borderColor: '#0c8699ff',
            },
        ],
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                ticks: {},
            },
        },
        plugins: {
            title: {
                display: true,
                text: 'Application Trend Over the Past 8 Weeks',
                font: {
                    size: 16,
                    weight: 'bold',
                },
                padding: {
                    top: 20,
                    bottom: 20,
                },
                color: 'black',
            },
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 14,
                    },
                },
            },
        },
    };

    return (
        <div className={styles.applicationLineChart}>
            {totalApplications === 0 ? (
                <div className={styles.noApplicationMessage}>
                    No job applications applied in the last eight weeks. Start adding some to see your progress here!
                </div>
            ) : (
                <>
                    <Line data={data} options={options} />
                    <div className={styles.application}>
                        Total Applications Applied in the Past Eight Weeks: {totalApplications}
                    </div>
                </>
            )}
        </div>
    );
};

export default ApplicationsLineChart;
