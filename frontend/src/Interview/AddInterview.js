import { useState } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import Notification from '../Notification.js'
import './AddInterview.css'

const AddInterview = () => {
    const [interviewDate, setInterviewDate] = useState('')
    const [interviewLocation, setInterviewLocation] = useState('')
    const [interviewType, setInterviewType] = useState('')
    const [notes, setNotes] = useState('')
    const navigate = useNavigate()
    const [notification, setNotification] = useState(null)
    const location = useLocation()
    // Receives the state that has been passed when user clicks 'Click here to add an interview' button
    const app = location.state?.app

    // Forbids users from adding interview without clicking 'Click here to add an interview' button
    if (!app) {
        return <Navigate to='/viewapplications' />
    }

    // datetime-local displays in the format of YYYY-MM-DDThh:mm:sssZ
    const [year, month, day, hour, minute] = interviewDate.split(/[-T:]/)
    // Decrements month by 1 since month starts from 0
    const localDate = new Date(year, month - 1, day, hour, minute)

    const handleAdd = async e => {
        e.preventDefault()

        if (interviewDate === '' || interviewLocation === '') {
            alert('Please enter date and location before adding an interview')
            return
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/interview/add`,
                {
                    method: 'POST',
                    headers:
                    {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ jobId: app.job_id, interviewDate: localDate, interviewLocation, interviewType, notes })
                }
            )
            const message = await res.text()
            setNotification({ message, type: res.ok ? 'success' : 'error' })

            // Resets interview z after successfully adding a new interview
            setInterviewDate('')
            setInterviewLocation('')
            setInterviewType('')
            setNotes('')

            // Removes notification bar after 2 seconds
            setTimeout(() => {
                setNotification(null)
            }, 2000)
        } catch (error) {
            alert('Failed to add an application: ' + error.message)
        }
    }

    return (
        <div className='add-interview'>
            <div className="interview-header">
                <h2>You are adding an interview for:</h2>
                <p>Company: <em>{app.company_name}</em></p>
                <p>Position: <em>{app.job_title}</em></p>
            </div>

            <label>Input Interview Date</label>
            <input
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                type='datetime-local'
                required
            />

            <label>Input Interview Location</label>
            <input
                value={interviewLocation}
                onChange={e => setInterviewLocation(e.target.value)}
                required
                placeholder='E.g. Zoom'
            />

            <label>Input Interview Type (optional)</label>
            <input
                value={interviewType}
                onChange={e => setInterviewType(e.target.value)}
            />

            <label>Input Additional Notes (optional)</label>
            <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
            />

            <div className='submit-button'>
                <button onClick={handleAdd}>Add Interview</button>
                <button onClick={() => navigate('/viewinterviews')}>View Interviews</button>
                <Link to={`/viewapplications#${app.job_id}`}>Back</Link>
            </div>
            <Notification message={notification} />
        </div>
    )
}

export default AddInterview
