import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import type { ChartOptions } from 'chart.js';
import type { JobStatusCount } from './models';
import { Pie } from 'react-chartjs-2';
import styles from './JobStatusChart.module.css';
import { useJobTrackerAPI } from '../../api/useJobTrackerAPI';
import { useToast } from '../../components/toast/ToastProvider';
import type { JobStatus } from '../jobApplication/models';

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

    const getColourByStatus = (status: JobStatus) => {
        if (status === 'Accepted') {
            return '#198754';
        }
        if (status === 'Applied') {
            return '#17A2B8';
        }
        if (status === 'Declined') {
            return 'purple';
        }
        if (status === 'Interview') {
            return '#0d6efd';
        }
        if (status === 'Ghosted') {
            return '#6C757D';
        }
        if (status === 'Offer') {
            return '#ffc107';
        }
        if (status === 'Rejected') {
            return '#dc3545';
        }
    };

    const getBorderColourByStatus = (status: JobStatus) => {
        if (status === 'Accepted') {
            return '#0f7847ff';
        }
        if (status === 'Applied') {
            return '#1495a9ff';
        }
        if (status === 'Declined') {
            return 'rebeccapurple';
        }
        if (status === 'Ghosted') {
            return 'rgba(122, 122, 148, 1)';
        }
        if (status === 'Interview') {
            return 'rgba(48, 153, 153, 1)';
        }
        if (status === 'Offer') {
            return '#d9a302ff';
        }
        if (status === 'Rejected') {
            return '#dc3545';
        }
    };

    const data = {
        labels: statuses,
        datasets: [
            {
                label: '# of applications',
                data: statusCounts,
                backgroundColor: statuses.map((status) => getColourByStatus(status)),
                borderColor: statuses.map((status) => getBorderColourByStatus(status)),
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
