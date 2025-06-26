import './AddApplication.css'
import Notification from '../Notification.js'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const AddApplication = () => {
    const [companyName, setCompanyName] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [jobStatus, setJobStatus] = useState('Applied')
    const [applicationDate, setApplicationDate] = useState('')
    const [jobLocation, setJobLocation] = useState('')
    const [jobURL, setJobURL] = useState('')
    const navigate = useNavigate()
    const [notification, setNotification] = useState(null)
    const currDate = new Date(Date.now())

    const isAppDatePresent = (appDate) => {
        if (appDate === '') {
            return currDate
        }
        // datetime-local displays in the format of YYYY-MM-DDThh:mm:sssZ
        const [year, month, day, hour, minute] = appDate.split(/[-T:]/)
        // Decrements month by 1 since month starts from 0
        const localDate = new Date(year, month - 1, day, hour, minute)
        return localDate
    }

    const handleAdd = async e => {
        e.preventDefault()

        if (companyName === '' || jobTitle === '') {
            alert('Please enter company name and job title before adding a job application')
            return
        }

        const appDate = isAppDatePresent(applicationDate)

        if (appDate > currDate) {
            alert('Application date cannot be later than current date')
            return
        }

        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/application/add`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ companyName, jobTitle, appDate, jobStatus, jobLocation, jobURL })
                }
            )
            const message = await res.text()
            setNotification({ message, type: res.ok ? 'success' : 'error' })

            // Resets assignment form after successfully adding a new assignment
            setCompanyName('')
            setJobTitle('')
            setJobStatus('Applied')
            setApplicationDate('')
            setJobLocation('')
            setJobURL('')

            // Removes notification bar after 2 seconds
            setTimeout(() => {
                setNotification(null)
            }, 2000)
        } catch (error) {
            alert('Failed to add an application: ' + error.message)
        }
    }

    return (
        <div className='add-application'>
            <h2>Add a job application</h2>

            <label>Input Company Name</label>
            <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
            />

            <label>Input Job Title</label>
            <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                required
            />

            <label>Input Job Status</label>
            <select value={jobStatus} onChange={e => setJobStatus(e.target.value)}>
                <option value='Accepted'>Accepted</option>
                <option value='Applied'>Applied</option>
                <option value='Ghosted'>Ghosted</option>
                <option value='Interview'>Interview</option>
                <option value='Offer'>Offer</option>
                <option value='Rejected'>Rejected</option>
            </select>

            <label>Input Application Date (uses current date if left blank)</label>
            <input
                value={applicationDate}
                onChange={e => setApplicationDate(e.target.value)}
                type='datetime-local'
            />

            <label>Input Job Location (optional)</label>
            <input
                value={jobLocation}
                onChange={e => setJobLocation(e.target.value)}
            />

            <label>Input Job Posting URL (optional)</label>
            <input
                value={jobURL}
                onChange={e => setJobURL(e.target.value)}
            />

            <div className='submit-button'>
                <button onClick={handleAdd}>Add Job Application</button>
                <button onClick={() => navigate('/viewapplications')}>View Job Applications</button>
            </div>
            <Notification message={notification} />
        </div>
    )
}

export default AddApplication
