import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CSVLink } from 'react-csv'
import DateFormatter from '../../../helper/dateFormatter'
import type { EntityId } from '../../jobApplication/models'
import type { JobInterview } from '../models'
import PrimaryButton from '../../../components/button/PrimaryButton'
// Taken from: https://www.npmjs.com/package/react-csv
import { routes } from '../../../routes'
import styles from './ViewInterview.module.css'
import { useConfirm } from 'material-ui-confirm'
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI'
import { useToast } from '../../../components/toast/ToastProvider'

const ViewInterview = () => {
    const navigate = useNavigate()
    const api = useJobTrackerAPI()
    const [interviews, setInterviews] = useState<JobInterview[]>([])
    const confirm = useConfirm()
    const { showErrorToast } = useToast()

    useEffect(() => {
        let isActive = true

        const fetchInterviews = async () => {
            try {
                const data = await api.interview.listInterviews()
                if (isActive) setInterviews(Array.isArray(data) ? data : [])
            } catch (error) {
                showErrorToast((error as Error).message)
            }
        }

        void fetchInterviews()
        return () => { isActive = false }
    }, [])

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Location', key: 'interview_location' },
        { label: 'Interview Date', key: 'interview_date' },
        { label: 'Interview Type', key: 'interview_type' },
        { label: 'Additional Notes', key: 'notes' },
    ]

    const data = interviews.map(interview => ({
        ...interview,
        interview_date: DateFormatter(interview.interview_date).formattedDate,
        interview_type: interview.interview_type ? interview.interview_type : 'N/A',
        notes: interview.notes ? interview.notes : 'N/A',
    }))

    const handleDelete = async (interviewId: EntityId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this job interview? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await api.interview.deleteInterview({ interviewId })
                setInterviews(current => current.filter(interview => interview.interview_id !== interviewId))
            }
        } catch (error) {
            showErrorToast((error as Error).message)
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
                await api.interview.deleteAllInterviews()
                setInterviews([])
            }
        } catch (error) {
            showErrorToast((error as Error).message)
        }
    }

    const showAddinterviewMessage = (interviews: JobInterview[]) => {
        return interviews.length === 0
    }

    const hasInterviews = (applications: JobInterview[]) => {
        return applications.length !== 0
    }

    const showInterviewType = (field: JobInterview) => {
        if (field.interview_type === '') {
            return false
        }
        return true
    }

    const showInterviewNotes = (field: JobInterview) => {
        if (field.interview_notes === '') {
            return false
        }
        return true
    }

    return (
        <div className={styles.interviewList}>
            {showAddinterviewMessage(interviews) && <div><br/>No job interview found. Start adding one now! </div>}

            {interviews.map((interview, index) => (
                <div className={styles.interview} key={interview.interview_id}>

                    <div className={styles.interviewContent}>
                        <h2>{index + 1}. {interview.company_name}</h2>
                        <p>Job Title: {interview.job_title}</p>
                        <p className={styles.location}>Location: {interview.interview_location}</p>
                        {showInterviewType(interview) &&
                            <p className={styles.type}>Interview Type: {interview.interview_type}</p>}
                        {showInterviewNotes(interview) &&
                            <p className={styles.notes}>Notes: {interview.interview_notes}</p>}
                        <p className={styles.date}>Interview Date: {DateFormatter(interview.interview_date).formattedDate}</p>
                        <p>Time left: {DateFormatter(interview.interview_date).timeBeforeInterview}</p>
                        <Link to={`${routes.viewApplications}#${interview.job_id}`}>
                            Click here to review corresponding job application
                        </Link>
                    </div>

                    <div className={styles.buttonGroup}>
                        <PrimaryButton onClick={() => handleDelete(interview.interview_id)}>
                            Delete
                        </PrimaryButton>
                    </div>
                </div>
            ))}

            <div className={styles.interviewButton}>
                <PrimaryButton onClick={() => navigate(routes.addInterview)}>Add new interview</PrimaryButton>
                {hasInterviews(interviews) && <> <PrimaryButton onClick={() => handleDeleteAll()}>
                    Delete all interviews</PrimaryButton>
                    <PrimaryButton>
                        <CSVLink
                            data={data}
                            headers={headers}
                            filename='job_interviews.csv'
                            style={{ color: 'white', textDecoration: 'none' }}
                        >
                            Export as CSV
                        </CSVLink>
                    </PrimaryButton>
                </>}
            </div>
        </div>
    )
}

export default ViewInterview
