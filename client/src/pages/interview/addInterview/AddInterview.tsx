import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { JobApplication } from '../../jobApplication/models'
import { JobTrackerAPIError } from '../../../api/models'
import type { Location } from 'react-router-dom'
import type { MouseEvent } from 'react'
import PrimaryButton from '../../../components/button/PrimaryButton'
import { routes } from '../../../routes'
import styles from './AddInterview.module.css'
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI'
import { useState } from 'react'
import { useToast } from '../../../components/toast/ToastProvider'

const AddInterview = () => {
    const [interviewDate, setInterviewDate] = useState('')
    const [interviewLocation, setInterviewLocation] = useState('')
    const [interviewType, setInterviewType] = useState('')
    const [notes, setNotes] = useState('')
    const navigate = useNavigate()
    const location = useLocation() as Location<{ app?: JobApplication }>
    // Receives the state that has been passed when user clicks 'Click here to add an interview' button
    const app = location.state?.app
    const api = useJobTrackerAPI()
    const { showErrorToast, showSuccessToast } = useToast()

    // Forbids users from adding interview without clicking 'Click here to add an interview' button
    if (!app) {
        return <Navigate to={routes.viewApplications} replace />
    }

    const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()

        if (interviewDate === '' || interviewLocation === '') {
            showErrorToast('Please enter date and location before adding an interview')
            return
        }

        // datetime-local displays in the format of YYYY-MM-DDThh:mm:sssZ
        const [year, month, day, hour, minute] = interviewDate.split(/[-T:]/)
        // Decrements month by 1 since month starts from 0
        const localDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))

        try {
            const message = await api.interview.createInterview({ jobId: app.job_id, interviewDate: localDate, interviewLocation, interviewType, notes })
            showSuccessToast(message)

            // Resets interview z after successfully adding a new interview
            setInterviewDate('')
            setInterviewLocation('')
            setInterviewType('')
            setNotes('')

        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message)

                // The original flow clears the form after an HTTP error response.
                setInterviewDate('')
                setInterviewLocation('')
                setInterviewType('')
                setNotes('')

                return
            }
            showErrorToast('Failed to add an application: ' + (error as Error).message)
        }
    }

    return (
        <div className={styles.addInterview}>
            <div>
                <h2>You are adding an interview for:</h2>
                <p>Company: <em>{app.company_name}</em></p>
                <p>Position: <em>{app.job_title}</em></p>
            </div>

            <label htmlFor='date'>Input Interview Date</label>
            <input
                id='date'
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                type='datetime-local'
                required
            />

            <label htmlFor='location'>Input Interview Location</label>
            <input
                id='location'
                value={interviewLocation}
                onChange={e => setInterviewLocation(e.target.value)}
                required
                placeholder='E.g. Zoom'
            />

            <label htmlFor='type'>Input Interview Type (optional)</label>
            <input
                id='type'
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
            />

            <label htmlFor='notes'>Input Additional Notes (optional)</label>
            <input
                id='notes'
                value={notes}
                onChange={e => setNotes(e.target.value)}
            />

            <div className={styles.submitButton}>
                <PrimaryButton data-testid='add-interview' onClick={handleAdd}>Add Interview</PrimaryButton>
                <PrimaryButton onClick={() => navigate(routes.viewInterviews)}>View Interviews</PrimaryButton>
                <Link to={`${routes.viewApplications}#${app.job_id}`}>
                    Back
                </Link>
            </div>
        </div>
    )
}

export default AddInterview
