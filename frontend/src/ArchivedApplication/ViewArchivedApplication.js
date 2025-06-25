import './ViewArchivedApplication.css'
import DateFormatter from '../Formatter/DateFormatter.js'
import { useConfirm } from 'material-ui-confirm'
import { useEffect } from 'react'
import useFetchData from '../useFetchData.js'
import { useLocation } from 'react-router-dom'

const ViewArchivedApplication = () => {
    const { data: archivedApplications, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/archivedapplication/view`)
    const location = useLocation()
    const confirm = useConfirm()

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
            }, 4000)
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
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
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

    const handleUnarchive = async (archivedJobId) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/archivedapplication/unarchive`,
                {
                    method: 'POST',
                    headers:
                    {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
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

    const showDeleteAllButton = (archivedApplications) => {
        return archivedApplications && archivedApplications.length !== 0
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

            {showArchiveApplicationMessage(archivedApplications) && <div>No archived job application found. Start archiving now! </div>}

            {archivedApplications && archivedApplications.map((application, index) => (
                <div className='application' key={application.job_id} id={application.job_id}>

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
                </div>
            ))}

            <div className='application-button'>
                {showDeleteAllButton(archivedApplications) &&
                <button onClick={() => handleDeleteAll()}>Delete all archived applications</button>}
            </div>
        </div>
    )
}

export default ViewArchivedApplication
