import './JobStatusChart.css'
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import useFetchData from '../useFetchData.js'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

const JobStatusChart = () => {
    const { data: applications } = useFetchData(`${process.env.REACT_APP_API_URL}/application/jobstatuscount`)
    const jobStatusCountPair = (applications ?? []).reduce((acc, row) => {
        acc[row.job_status] = row.count
        return acc
    }, {})

    const totalApplications = Object.values(jobStatusCountPair).reduce((sum, val) => sum + parseInt(val), 0)

    const getColourByStatus = (status) => {
        if (status === 'Accepted') {
            return '#198754'
        }
        if (status === 'Applied') {
            return '#6c757d'
        }
        if (status === 'Interview') {
            return '#0d6efd'
        }
        if (status === 'Ghosted') {
            return '#b8b8d1'
        }
        if (status === 'Offer') {
            return '#ffc107'
        }
        if (status === 'Rejected') {
            return '#dc3545'
        }
    }

    const getBorderColourByStatus = (status) => {
        if (status === 'Accepted') {
            return '#0f7847ff'
        }
        if (status === 'Applied') {
            return '#5b636bff'
        }
        if (status === 'Ghosted') {
            return '#9b9bb6ff'
        }
        if (status === 'Interview') {
            return 'rgba(48, 153, 153, 1)'
        }
        if (status === 'Offer') {
            return '#d9a302ff'
        }
        if (status === 'Rejected') {
            return '#dc3545'
        }
    }

    const data = {
        labels: Object.keys(jobStatusCountPair),
        datasets: [
            {
                label: '# of applications',
                data: Object.values(jobStatusCountPair),
                backgroundColor: Object.keys(jobStatusCountPair).map(status => getColourByStatus(status)),
                borderColor: Object.keys(jobStatusCountPair).map(status => getBorderColourByStatus(status)),
                borderWidth: 0.7,
                hoverOffset: 60
            },
        ],
    }

    const options = {
        responsive: true,
        plugins: {
            title: {
                display: true,
                text: 'Job Applications Count by Status',
                font: {
                    size: 18,
                    weight: 'bold'
                },
                padding: {
                    top: 20,
                    bottom: 20
                },
                color: 'black'
            },
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            },
        }
    }

    return (
        <div className='job-status-chart'>
            {totalApplications === 0 ? (
                <div className='no-application-message'>
                    No job applications found. Start adding one now to see your application status breakdown!
                </div>
            ) : (
                <>
                    <Pie data={data} options={options} />
                    <div className='application'>
                        Total Applications Applied: {totalApplications}
                    </div>
                </>
            )}
        </div>
    )
}

export default JobStatusChart
