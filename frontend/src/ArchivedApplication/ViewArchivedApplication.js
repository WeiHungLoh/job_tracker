import './ViewArchivedApplication.css'
// Taken from: https://www.npmjs.com/package/react-csv
import { useEffect, useState } from 'react'
import { CSVLink } from 'react-csv'
import DateFormatter from '../Formatter/DateFormatter.js'
import ShowNotesButton from '../Icons/ShowNotesButton.js'
import { useConfirm } from 'material-ui-confirm'
import useFetchData from '../useFetchData.js'
import { useLocation } from 'react-router-dom'

const ViewArchivedApplication = () => {
    const { data: archivedApplications, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/archivedapplication/view`)
    const location = useLocation()
    const confirm = useConfirm()
    const [jobStatus, setJobStatus] = useState('Show All')
    const [toggleNotes, setToggleNotes] = useState(false)
    const [notes, setNotes] = useState({})

    const filteredApplications = (archivedApplications ?? []).filter(app => {
        if (jobStatus === 'Show All') {
            return true
        } else {
            return app.job_status === jobStatus
        }
    })

    const headers = [
        { label: 'Company', key: 'company_name' },
        { label: 'Job Title', key: 'job_title' },
        { label: 'Application Date', key: 'application_date' },
        { label: 'Status', key: 'job_status' },
        { label: 'Location', key: 'job_location' },
        { label: 'Job URL', key: 'job_posting_url' },
        { label: 'Notes', key: 'notes' },
    ]

    const data = (filteredApplications ?? []).map(app => ({
        ...app,
        application_date: DateFormatter(app.application_date).formattedDate,
        job_location: app.job_location ? app.job_location : 'N/A',
        job_posting_url: app.job_posting_url ? app.job_posting_url : 'N/A',
        notes: app.notes ? app.notes : 'N/A',
    }))

    useEffect(() => {
        // Obtains application.job_id from <Link> in AddInterview
        const hash = location.hash
        if (hash) {
            setTimeout(() => {
                // Ignores the first string character # to get job_id
                const app = document.getElementById(hash.substring(1))
                if (app) {
                    app.scrollIntoView({ behavior: 'smooth' })

                    // Add the 'highlighted' class when the application scrolls into view,
                    // and remove it after 4 seconds to match transition time
                    app.classList.add('highlighted')
                    setTimeout(() => {
                        app.classList.remove('highlighted')
                    }, 4000)
                }
            }, 100)
        }
    }, [location])

    const handleDelete = async (archivedApplicationId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this archived job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/archivedapplication/${archivedApplicationId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                })
            }
            // Refreshes UI to show remaining undeleted archivedApplications
            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete all archived job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/archivedapplication/deleteall`,
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

    const handleUnarchive = async (archivedJobId) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/archivedapplication/unarchive`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify({ archivedJobId })
                }
            )
            refetch()
        } catch (error) {
            alert('Failed to archive an application ' + error.message)
        }
    }

    const showArchiveApplicationMessage = (archivedApplications) => {
        return archivedApplications && archivedApplications.length === 0
    }

    const hasApplications = (applications) => {
        return applications && applications.length !== 0
    }

    const showJobLocation = (field) => {
        if (field.job_location === '') {
            return false
        }
        return true
    }

    const showJobURL = (field) => {
        if (field.job_posting_url === '') {
            return false
        }
        return true
    }

    const checkJobStatus = (application) => {
        const jobStatus = application.job_status

        if (jobStatus === 'Accepted') {
            return 'accepted'
        } else if (jobStatus === 'Applied') {
            return 'applied'
        } else if (jobStatus === 'Ghosted') {
            return 'ghosted'
        } else if (jobStatus === 'Interview') {
            return 'interview'
        } else if (jobStatus === 'Offer') {
            return 'offer'
        } else {
            return 'rejected'
        }
    }

    return (
        <div className='archived-application-list'>
            <h2>Archived Job Application Viewer</h2>

            <div className='filter-option'>
                <div>Filter by</div>
                <select value={jobStatus} onChange={e => setJobStatus(e.target.value)}>
                    <option value='Show All'>Show All</option>
                    <option value='Accepted'>Accepted</option>
                    <option value='Applied'>Applied</option>
                    <option value='Ghosted'>Ghosted</option>
                    <option value='Interview'>Interview</option>
                    <option value='Offer'>Offer</option>
                    <option value='Rejected'>Rejected</option>
                </select>
            </div>

            {hasApplications(filteredApplications) &&
                <ShowNotesButton toggled={toggleNotes} onToggle={() => setToggleNotes(!toggleNotes)}
             />}

            {showArchiveApplicationMessage(filteredApplications) && <div>No archived job application with that job status found. Start archiving now! </div>}

            {filteredApplications && filteredApplications.map((application, index) => (
                <div className='application' key={application.archived_job_id} id={application.archived_job_id}>

                    <div className='application-content'>
                        <h2>{index + 1}. {application.company_name}</h2>
                        <p>Job Title: {application.job_title}</p>
                        {showJobLocation(application) &&
                            <p>Location: {application.job_location}</p>}
                        <p className='date'>Application Date: {DateFormatter(application.application_date).formattedDate}</p>
                        <p>Time since application: {DateFormatter(application.application_date).timeSinceApplication}</p>
                        <p className={checkJobStatus(application)}>Job Status: {application.job_status}</p>

                        {showJobURL(application) &&
                            <a className='url' href={application.job_posting_url} target='_blank' rel='noreferrer'>
                                Click here to head to job application URL
                            </a>}
                    </div>

                    <div className='button-group'>
                        <div className='unarchive-button' onClick={() => handleUnarchive(application.archived_job_id)}>
                            <button>
                                Unarchive
                            </button>
                        </div>

                        <button onClick={() => handleDelete(application.archived_job_id)}>
                            Delete
                        </button>
                    </div>
                    {toggleNotes &&
                    <div className='notes'>
                        <textarea
                            value={
                                !application.notes || application.notes.trim() === ''
                                    ? 'You do not have any notes here'
                                    : application.notes
                            }
                            disabled='true'
                        />
                    </div>
                }
                </div>
            ))}

            <div className='application-button'>
                {hasApplications(filteredApplications) && <>
                    <button onClick={() => handleDeleteAll()}>Delete all archived applications</button>
                    <button>
                        <CSVLink
                            data={data}
                            headers={headers}
                            filename={'archived_job_applications.csv'}
                            style={{ color: 'white' }}
                        >
                            Export as CSV
                        </CSVLink>
                    </button>
                </>}
            </div>
        </div>
    )
}

export default ViewArchivedApplication
