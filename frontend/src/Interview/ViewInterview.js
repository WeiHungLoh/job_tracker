import { useNavigate, Link } from 'react-router-dom'
import useFetchData from '../useFetchData.js'
import DateFormatter from '../Formatter/DateFormatter.js'
import { useConfirm } from 'material-ui-confirm'
import './ViewInterview.css'

const ViewInterview = () => {
    const navigate = useNavigate()
    const { data: interviews, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/interview/view`)
    const confirm = useConfirm()

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
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
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
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
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

    const showDeleteAllButton = (interviews) => {
        return interviews && interviews.length !== 0
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
                {showDeleteAllButton(interviews) && <button onClick={() => handleDeleteAll()}>
                    Delete all interviews</button>}
            </div>
        </div>
    )
}

export default ViewInterview
