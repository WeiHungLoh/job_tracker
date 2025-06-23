import { Link } from 'react-router-dom'
import useFetchData from '../useFetchData.js'
import DateFormatter from '../Formatter/DateFormatter.js'
import './ViewArchivedInterview.css'

const ViewArchivedInterview = () => {
    const { data: archivedInterviews, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/archivedinterview/view`)

    const handleDelete = async (interviewId) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/archivedinterview/${interviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            // Refreshes UI to show remaining undeleted interviews
            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const handleDeleteAll = async () => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/archivedinterview/deleteall`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            )

            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const showArchiveInterviewMessage = (archivedInterviews) => {
        return archivedInterviews && archivedInterviews.length === 0
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
        <div className='archived-interview-list'>
            <h2>Archived Job Interview Viewer</h2>

            {showArchiveInterviewMessage(archivedInterviews) && <div>No archived job interview found. Start archiving now! </div>}

            {archivedInterviews && archivedInterviews.map((interview, index) => (
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
                        <Link to={`/viewarchivedapplications#${interview.job_id}`}>
                            Click here to review corresponding job application
                        </Link>
                    </div>

                    <div className='button-group'>
                        <button onClick={() => handleDelete(interview.archived_interview_id)}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}

            <div className='interview-button'>
                <button onClick={() => handleDeleteAll()}>Delete all archived interviews</button>
            </div>
        </div>
    )
}

export default ViewArchivedInterview
