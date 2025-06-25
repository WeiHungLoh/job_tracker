import './ViewApplication.css'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DateFormatter from '../Formatter/DateFormatter.js'
import ToggleButton from '../Icons/ToggleButton.js'
import { useConfirm } from 'material-ui-confirm'
import useFetchData from '../useFetchData.js'

const ViewApplication = () => {
    const navigate = useNavigate()
    const { data: applications, refetch } = useFetchData(`${process.env.REACT_APP_API_URL}/application/view`)
    const [jobStatuses, setJobStatuses] = useState({})
    const { data: interviews } = useFetchData(`${process.env.REACT_APP_API_URL}/interview/view`)
    const [interviewJobId, setInterviewJobId] = useState([])
    const [toggled, setToggled] = useState(false)
    const confirm = useConfirm()

    useEffect(() => {
        if (interviews) {
            const jobIds = interviews.map(interview => interview.job_id)
            setInterviewJobId(jobIds)
        }
    }, [interviews])

    useEffect(() => {
        // Obtain application.job_id from <Link> in AddInterview
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

    const handleDelete = async (applicationId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/application/${applicationId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-type': 'application/json'
                    },
                    body: JSON.stringify({ applicationId })
                })

                // Refreshes UI to show remaining undeleted applications
                refetch()
            }
        } catch (error) {
            alert(error.message)
            return
        }
    }

    const handleDeleteAll = async () => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete all job applications? This action is permanent and cannot be undone.',
                confirmationText: 'Delete All',
                cancellationText: 'Cancel',
            })

            if (confirmed) {
                await fetch(`${process.env.REACT_APP_API_URL}/application/deleteall`,
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

    const toggleEditStatus = async (application) => {
        const editStatus = application.edit_status
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/application/toggleeditstatus`, {
                method: 'PUT',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ jobId: application.job_id })
            })

            if (editStatus) {
                await fetch(`${process.env.REACT_APP_API_URL}/application/togglejobstatus`, {
                    method: 'PUT',
                    headers: {
                        'Content-type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        jobStatus: jobStatuses[application.job_id] ?? application.job_status,
                        jobId: application.job_id
                    })
                })
                await refetch()

                setTimeout(() => {
                    const app = document.getElementById(application.job_id)
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

            refetch()
        } catch (error) {
            alert(error.message)
        }
    }

    const handleArchive = async (jobId) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/archivedapplication/archive`,
                {
                    method: 'POST',
                    headers:
                    {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ jobId })
                }
            )
            refetch()
        } catch (error) {
            alert('Failed to archive an application ' + error.message)
        }
    }

    const isEditStatus = (editStatus) => {
        return editStatus
    }

    const isStatusInterview = (jobStatus) => {
        if (jobStatus === 'Interview') {
            return true
        }
        return false
    }

    const showAddApplicationMessage = (applications) => {
        return applications && applications.length === 0
    }

    const showDeleteAllButton = (applications) => {
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
        <div className='application-list'>
            <h2>Job Application Viewer</h2>
            <ToggleButton toggled={toggled} onToggle={() => setToggled(!toggled)} />

            {showAddApplicationMessage(applications) && <div>No job application found. Start adding one now! </div>}

            {applications && applications.map((application, index) => (
                <div className='application' key={application.job_id} id={application.job_id}>

                    <div className='application-content'>
                        <h2>{index + 1}. {application.company_name}</h2>
                        <p>Job Title: {application.job_title}</p>
                        {showJobLocation(application) &&
                            <p>Location: {application.job_location}</p>}
                        <p className='date'>Application Date: {DateFormatter(application.application_date).formattedDate}</p>
                        <p>Time since application: {DateFormatter(application.application_date).timeSinceApplication}</p>
                        <p className={checkJobStatus(application)}>Job Status: {application.job_status}</p>

                        {isEditStatus(application.edit_status) && <select
                            value={jobStatuses[application.job_id] ?? application.job_status}
                            onChange={e =>
                                setJobStatuses(app => ({
                                    ...app,
                                    [application.job_id]: e.target.value
                                }))
                            }
                        >
                            <option value='Accepted'>Accepted</option>
                            <option value='Applied' disabled=
                                {interviewJobId.includes(application.job_id)}>Applied</option>
                            <option value='Ghosted'>Ghosted</option>
                            <option value='Interview'>Interview</option>
                            <option value='Offer'>Offer</option>
                            <option value='Rejected'>Rejected</option>
                        </select>}

                        {isStatusInterview(application.job_status) &&
                            <Link to='/addinterview' state={{
                                app: application
                            }}>
                                Click here to add an interview
                            </Link>
                        }
                        {showJobURL(application) &&
                            <a className='url' href={application.job_posting_url} target='_blank' rel='noreferrer'>
                                Click here to head to job application URL
                            </a>}
                    </div>

                    <div className='button-group'>
                        <button onClick={() => toggleEditStatus(application)}>
                            {isEditStatus(application.edit_status) ? 'Save Changes' : 'Edit Status'}
                        </button>

                        <button onClick={() => handleDelete(application.job_id)}>
                            Delete
                        </button>

                        {toggled &&
                            <div className='archive-button' onClick={() => handleArchive(application.job_id)}>
                                <button>
                                    Archive
                                </button>
                            </div>
                        }
                    </div>
                </div>
            ))}

            <div className='application-button'>
                <button onClick={() => navigate('/addapplication')}>Add new application</button>
                {showDeleteAllButton(applications) && <button onClick={() => handleDeleteAll()}>
                        Delete all applications</button>}
            </div>
        </div>
    )
}

export default ViewApplication
