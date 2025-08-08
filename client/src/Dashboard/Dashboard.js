import './Dashboard.css'
import ApplicationsLineChart from './ApplicationsLineChart.js'
import JobStatusChart from './JobStatusChart.js'

const Dashboard = () => {
    return(
        <div className='dashboard'>
            <ApplicationsLineChart />
            <JobStatusChart />
        </div>
    )
}

export default Dashboard
