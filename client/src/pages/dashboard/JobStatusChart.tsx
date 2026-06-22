import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import type { ChartOptions } from 'chart.js';
import type { JobStatusCount } from './models';
import { Pie } from 'react-chartjs-2';
import styles from './JobStatusChart.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import { JOB_STATUS_COLORS } from '../jobApplication/models';

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const JobStatusChart = () => {
    const api = useJobTrackerAPI();
    const [applications, setApplications] = useState<JobStatusCount[]>([]);
    const { showErrorToast } = useToast();

    useEffect(() => {
        let isActive = true;

        const fetchApplications = async () => {
            try {
                const data = await api.application.listJobStatusCounts();
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

    const statuses = applications.map((application) => application.job_status);
    const statusCounts = applications.map((application) => application.count);

    const totalApplications = statusCounts.reduce((sum, value) => sum + parseInt(value), 0);

    const data = {
        labels: statuses,
        datasets: [
            {
                label: '# of applications',
                data: statusCounts,
                backgroundColor: statuses.map((status) => JOB_STATUS_COLORS[status].color),
                borderColor: statuses.map((status) => JOB_STATUS_COLORS[status].borderColor),
                borderWidth: 0.7,
                hoverOffset: 60,
            },
        ],
    };

    const options: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: 'Application Status Overview',
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
        <div className={styles.jobStatusChart}>
            {totalApplications === 0 ? (
                <div className={styles.noApplicationMessage}>
                    No job applications found. Start adding one now to see your application status breakdown!
                </div>
            ) : (
                <>
                    <Pie data={data} options={options} />
                    <div className={styles.application}>Total Applications Applied: {totalApplications}</div>
                </>
            )}
        </div>
    );
};

export default JobStatusChart;
