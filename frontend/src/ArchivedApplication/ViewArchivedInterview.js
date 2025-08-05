import './ViewArchivedInterview.css'
// Taken from: https://www.npmjs.com/package/react-csv
import { CSVLink } from 'react-csv'
import DateFormatter from '../Formatter/DateFormatter.js'
import { Link } from 'react-router-dom'
import { useConfirm } from 'material-ui-confirm'
import useFetchData from '../useFetchData.js'

const ViewArchivedInterview = () => {
    const { data: archivedInterviews, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/archivedinterview/view`)
    const confirm = useConfirm()

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Location', key: 'interview_location' },
        { label: 'Interview Date', key: 'interview_date' },
        { label: 'Interview Type', key: 'interview_type' },
        { label: 'Additional Notes', key: 'notes' },
    ]

    const data = (archivedInterviews ?? []).map(interview => ({
        ...interview,
        interview_date: DateFormatter(interview.interview_date).formattedDate,
        interview_type: interview.interview_type ? interview.interview_type : 'N/A',
        notes: interview.notes ? interview.notes : 'N/A',
    }))

    const handleDelete = async (interviewId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this archived job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/archivedinterview/${interviewId}`, {
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
                description: 'Are you sure you want to delete all archived job interviews? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/archivedinterview/deleteall`,
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

    const showArchiveInterviewMessage = (archivedInterviews) => {
        return archivedInterviews && archivedInterviews.length === 0
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
        if (field.interview_notes === '') {
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
                            <p>Notes: {interview.interview_notes}</p>}
                        <p className='date'>Interview Date: {DateFormatter(interview.interview_date).formattedDate}</p>
                        <p>Time left: {DateFormatter(interview.interview_date).timeBeforeInterview}</p>
                        <Link to={`/viewarchivedapplications#${interview.archived_job_id}`}>
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
                {hasInterviews(archivedInterviews) && <>
                    <button onClick={() => handleDeleteAll()}>Delete all archived interviews</button>
                    <button>
                        <CSVLink
                            data={data}
                            headers={headers}
                            filename='archived_job_interviews.csv'
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

export default ViewArchivedInterview
