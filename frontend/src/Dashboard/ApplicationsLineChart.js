import './ApplicationsLineChart.css'
import {
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js'
import DateFormatter from '../Formatter/DateFormatter.js'
import { Line } from 'react-chartjs-2'
import useFetchData from '../useFetchData.js'

ChartJS.register(
    CategoryScale,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title,
    Tooltip,
)

const ApplicationsLineChart = () => {
    const { data: applications } = useFetchData(`${process.env.REACT_APP_API_URL}/application/jobapplicationsbyweek`)
    const applicationByWeekCountPair = (applications ?? []).reduce((acc, row) => {
        acc[row.start_of_week] = row.applications_count
        return acc
    }, {})

    const totalApplications = Object.values(applicationByWeekCountPair).reduce((sum, val) => sum + parseInt(val), 0)

    const data = {
        labels: Object.keys(applicationByWeekCountPair).map(date => DateFormatter(date).formattedDay),
        datasets: [
            {
                label: 'Applications Applied',
                data: Object.values(applicationByWeekCountPair),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 99, 132)',
            }
        ],
    }

    const options = {
        responsive: true,
        scales: {
            y: {
                ticks: {
                }
            }
        },
        plugins: {
            title: {
                display: true,
                text: 'Number of Applications Applied Per Week for the Last Eight Weeks',
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
        <div className='application-line-chart'>
            {totalApplications === 0 ? (
                <div className='no-application-message'>
                    No job applications applied in the last eight weeks. Start adding some to see your progress here!
                </div>
            ) : (
                <>
                    <Line data={data} options={options} />
                    <div className='application'>
                        Total Applications Applied in the Past Eight Weeks: {totalApplications}
                    </div>
                </>
            )}
        </div>
    )
}

export default ApplicationsLineChart
