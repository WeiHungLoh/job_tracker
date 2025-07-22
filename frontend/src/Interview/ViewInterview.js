import './ViewInterview.css'
import { Link, useNavigate } from 'react-router-dom'
// Taken from: https://www.npmjs.com/package/react-csv
import { CSVLink } from 'react-csv'
import DateFormatter from '../Formatter/DateFormatter.js'
import { useConfirm } from 'material-ui-confirm'
import useFetchData from '../useFetchData.js'

const ViewInterview = () => {
    const navigate = useNavigate()
    const { data: interviews, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/interview/view`)
    const confirm = useConfirm()

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Location', key: 'interview_location' },
        { label: 'Interview Date', key: 'interview_date' },
        { label: 'Interview Type', key: 'interview_type' },
        { label: 'Additional Notes', key: 'notes' },
    ]

    const data = (interviews ?? []).map(interview => ({
        ...interview,
        interview_date: DateFormatter(interview.interview_date).formattedDate,
        interview_type: interview.interview_type ? interview.interview_type : 'N/A',
        notes: interview.notes ? interview.notes : 'N/A',
    }))

    const handleDelete = async (interviewId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/interview/${interviewId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                })
            }
            // Refreshes UI to show remaining undeleted interviews
            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete all job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/interview/deleteall`,
                    {
                        method: 'DELETE',
                        credentials: 'include'
                    }
                )
            }

            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const showAddinterviewMessage = (interviews) => {
        return interviews && interviews.length === 0
    }

    const hasInterviews = (applications) => {
        return applications && applications.length !== 0
    }

    const showInterviewType = (field) => {
        if (field.interview_type === '') {
            return false
        }
        return true
    }

    const showInterviewNotes = (field) => {
        if (field.notes === '') {
            return false
        }
        return true
    }

    return (
        <div className='interview-list'>
            <h2>Job Interview Viewer</h2>

            {showAddinterviewMessage(interviews) && <div>No job interview found. Start adding one now! </div>}

            {interviews && interviews.map((interview, index) => (
                <div className='interview' key={interview.interview_id}>

                    <div className='interview-content'>
                        <h2>{index + 1}. {interview.company_name}</h2>
                        <p>Job Title: {interview.job_title}</p>
                        <p>Location: {interview.interview_location}</p>
                        {showInterviewType(interview) &&
                            <p>Interview Type: {interview.interview_type}</p>}
                        {showInterviewNotes(interview) &&
                            <p>Notes: {interview.notes}</p>}
                        <p className='date'>Interview Date: {DateFormatter(interview.interview_date).formattedDate}</p>
                        <p>Time left: {DateFormatter(interview.interview_date).timeBeforeInterview}</p>
                        <Link to={`/viewapplications#${interview.job_id}`}>
                            Click here to review corresponding job application
                        </Link>
                    </div>

                    <div className='button-group'>
                        <button onClick={() => handleDelete(interview.interview_id)}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}

            <div className='interview-button'>
                <button onClick={() => navigate('/addinterview')}>Add new interview</button>
                {hasInterviews(interviews) && <> <button onClick={() => handleDeleteAll()}>
                    Delete all interviews</button>
                    <button>
                        <CSVLink
                            data={data}
                            headers={headers}
                            filename='job_interviews.csv'
                            style={{ color: 'white', textDecoration: 'none' }}
                        >
                            Export as CSV
                        </CSVLink>
                    </button>
                </>}
            </div>
        </div>
    )
}

export default ViewInterview
