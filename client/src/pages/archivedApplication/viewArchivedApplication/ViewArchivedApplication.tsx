// Taken from: https://www.npmjs.com/package/react-csv
import { useEffect, useState } from 'react'
import type { ArchivedJobApplication } from '../models'
import { CSVLink } from 'react-csv'
import DateFormatter from '../../../helper/dateFormatter'
import type { EntityId } from '../../jobApplication/models'
import PrimaryButton from '../../../components/button/PrimaryButton'
import ShowNotesButton from '../../../components/showNotesButton/ShowNotesButton'
import styles from './ViewArchivedApplication.module.css'
import { useConfirm } from 'material-ui-confirm'
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI'
import { useLocation } from 'react-router-dom'
import { useToast } from '../../../components/toast/ToastProvider'

const ViewArchivedApplication = () => {
    const api = useJobTrackerAPI()
    const [archivedApplications, setArchivedApplications] = useState<ArchivedJobApplication[]>([])
    const location = useLocation()
    const confirm = useConfirm()
    const [jobStatus, setJobStatus] = useState('Show All')
    const [toggleNotes, setToggleNotes] = useState(false)
    const { showErrorToast } = useToast()

    const filteredApplications = archivedApplications.filter(app => {
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

    const data = filteredApplications.map(app => ({
        ...app,
        application_date: DateFormatter(app.application_date).formattedDate,
        job_location: app.job_location ? app.job_location : 'N/A',
        job_posting_url: app.job_posting_url ? app.job_posting_url : 'N/A',
        notes: app.notes ? app.notes : 'N/A',
    }))

    useEffect(() => {
        let isActive = true

        const fetchApplications = async () => {
            try {
                const data = await api.archivedApplication.listApplications()
                if (isActive) setArchivedApplications(Array.isArray(data) ? data : [])
            } catch (error) {
                showErrorToast((error as Error).message)
            }
        }

        void fetchApplications()
        return () => { isActive = false }
    }, [])

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
                    app.classList.add(styles.highlighted)
                    setTimeout(() => {
                        app.classList.remove(styles.highlighted)
                    }, 4000)
                }
            }, 100)
        }
    }, [location])

    const handleDelete = async (archivedApplicationId: EntityId) => {
        try {
            const { confirmed } = await confirm({
                title: 'Confirm Deletion',
                description: 'Are you sure you want to delete this archived job application? This action is permanent and cannot be undone.',
                confirmationText: 'Delete',
                cancellationText: 'Cancel',
                confirmationButtonProps: { autoFocus: true }
            })

            if (confirmed) {
                await api.archivedApplication.deleteApplication({ archivedApplicationId })
                setArchivedApplications(current => current.filter(
                    application => application.archived_job_id !== archivedApplicationId
                ))
            }
        } catch (error) {
            showErrorToast((error as Error).message)
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
                await api.archivedApplication.deleteAllApplications()
                setArchivedApplications([])
            }
        } catch (error) {
            showErrorToast((error as Error).message)
        }
    }

    const handleUnarchive = async (archivedJobId: EntityId) => {
        try {
            await api.archivedApplication.unarchiveApplication({ archivedJobId })
            setArchivedApplications(current => current.filter(
                application => application.archived_job_id !== archivedJobId
            ))
        } catch (error) {
            showErrorToast('Failed to archive an application ' + (error as Error).message)
        }
    }

    const showArchiveApplicationMessage = (archivedApplications: ArchivedJobApplication[]) => {
        return archivedApplications && archivedApplications.length === 0
    }

    const hasApplications = (applications: ArchivedJobApplication[]) => {
        return applications && applications.length !== 0
    }

    const showJobLocation = (field: ArchivedJobApplication) => {
        if (field.job_location === '') {
            return false
        }
        return true
    }

    const showJobURL = (field: ArchivedJobApplication) => {
        if (field.job_posting_url === '') {
            return false
        }
        return true
    }

    const checkJobStatus = (application: ArchivedJobApplication) => {
        const jobStatus = application.job_status

        if (jobStatus === 'Accepted') {
            return styles.accepted
        } else if (jobStatus === 'Applied') {
            return styles.applied
        } else if (jobStatus === 'Declined') {
            return styles.declined
        } else if (jobStatus === 'Ghosted') {
            return styles.ghosted
        } else if (jobStatus === 'Interview') {
            return styles.interview
        } else if (jobStatus === 'Offer') {
            return styles.offer
        } else {
            return styles.rejected
        }
    }

    return (
        <div className={styles.archivedApplicationList}>
            <div className={styles.listControls}>
                <div className={styles.filterOption}>
                    <div>Filter by</div>
                    <select role='listbox' value={jobStatus} onChange={e => setJobStatus(e.target.value)}>
                        <option value='Show All'>Show All</option>
                        <option value='Accepted'>Accepted</option>
                        <option value='Applied'>Applied</option>
                        <option value='Declined'>Declined</option>
                        <option value='Ghosted'>Ghosted</option>
                        <option value='Interview'>Interview</option>
                        <option value='Offer'>Offer</option>
                        <option value='Rejected'>Rejected</option>
                    </select>
                </div>

                {hasApplications(filteredApplications) &&
                    <ShowNotesButton toggled={toggleNotes} onToggle={() => setToggleNotes(!toggleNotes)}
                 />}
            </div>

            {showArchiveApplicationMessage(filteredApplications) && <div><br/>No archived job application with that job status found. Start archiving now! </div>}

            {filteredApplications && filteredApplications.map((application, index) => (
                <div className={styles.application} key={application.archived_job_id} id={String(application.archived_job_id)}>

                    <div className={styles.applicationContent}>
                        <h2>{index + 1}. {application.company_name}</h2>
                        <p>Job Title: {application.job_title}</p>
                        {showJobLocation(application) &&
                            <p className={styles.location}>Location: {application.job_location}</p>}
                        <p className={styles.date}>Application Date: {DateFormatter(application.application_date).formattedDate}</p>
                        <p>Time since application: {DateFormatter(application.application_date).timeSinceApplication}</p>
                        <p className={checkJobStatus(application)}>Job Status: {application.job_status}</p>

                        {showJobURL(application) &&
                            <a className={styles.url} href={application.job_posting_url} target='_blank' rel='noreferrer'>
                                Click here to head to job application URL
                            </a>}
                    </div>

                    <div className={styles.buttonGroup}>
                        <div onClick={() => handleUnarchive(application.archived_job_id)}>
                            <PrimaryButton>
                                Unarchive
                            </PrimaryButton>
                        </div>

                        <PrimaryButton onClick={() => handleDelete(application.archived_job_id)}>
                            Delete
                        </PrimaryButton>
                    </div>
                    {toggleNotes &&
                    <div className={styles.notes}>
                        <textarea
                            value={
                                !application.notes || application.notes.trim() === ''
                                    ? 'You do not have any notes here'
                                    : application.notes
                            }
                            disabled
                        />
                    </div>
                }
                </div>
            ))}

            <div className={styles.applicationButton}>
                {hasApplications(filteredApplications) && <>
                    <PrimaryButton onClick={() => handleDeleteAll()}>Delete all archived applications</PrimaryButton>
                    <PrimaryButton>
                        <CSVLink
                            data={data}
                            headers={headers}
                            filename={'archived_job_applications.csv'}
                            style={{ color: 'white' }}
                        >
                            Export as CSV
                        </CSVLink>
                    </PrimaryButton>
                </>}
            </div>
        </div>
    )
}

export default ViewArchivedApplication
