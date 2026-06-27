import { JobTrackerAPIError } from '../../../api/models';
import type { MouseEvent } from 'react';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { parseDatetimeLocal } from '../../../helper/dateFormatter';
import { routes } from '../../../routes';
import styles from './AddApplication.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';
import { JOB_STATUSES, type JobStatus } from '../models';

const AddApplication = () => {
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [jobStatus, setJobStatus] = useState<JobStatus>('Applied');
    const [applicationDate, setApplicationDate] = useState('');
    const [jobLocation, setJobLocation] = useState('');
    const [jobURL, setJobURL] = useState('');
    const navigate = useNavigate();
    const currDate = new Date(Date.now());
    const [isLoading, setIsLoading] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast, showSuccessToast } = useToast();

    const resetForm = () => {
        setCompanyName('');
        setJobTitle('');
        setJobStatus('Applied');
        setApplicationDate('');
        setJobLocation('');
        setJobURL('');
    };

    const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const trimmedCompanyName = companyName.trim();
        const trimmedJobTitle = jobTitle.trim();
        const trimmedJobLocation = jobLocation.trim();
        const trimmedJobURL = jobURL.trim();

        if (!trimmedCompanyName || !trimmedJobTitle) {
            showErrorToast('Please enter company name and job title before adding a job application');
            return;
        }

        const appDate = applicationDate ? parseDatetimeLocal(applicationDate) : currDate;

        if (appDate > currDate) {
            showErrorToast('Application date cannot be later than current date');
            return;
        }

        if (trimmedJobURL) {
            try {
                const parsedURL = new URL(trimmedJobURL);
                const hostname = parsedURL.hostname;

                // Ensures URL follows the format of <domain>.<suffix>
                const domainPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)+$/i;

                if (!domainPattern.test(hostname)) {
                    showErrorToast('URL must be in a valid format.');
                    return;
                }
            } catch {
                showErrorToast('URL must be in a valid format.');
                return;
            }
        }

        setIsLoading(true);
        try {
            const message = await api.application.createApplication({
                companyName: trimmedCompanyName,
                jobTitle: trimmedJobTitle,
                appDate,
                jobStatus,
                jobLocation: trimmedJobLocation,
                jobURL: trimmedJobURL,
            });
            showSuccessToast(message);
            resetForm();
        } catch (error) {
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message);
                resetForm();
                setIsLoading(false);
                return;
            }
            showErrorToast('Failed to add an application: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.addApplication}>
            <br />
            <label htmlFor='company-name'>Input Company Name</label>
            <input id='company-name' value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

            <label htmlFor='job-title'>Input Job Title</label>
            <input id='job-title' value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />

            <label>Input Job Status</label>
            <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value as JobStatus)}>
                {JOB_STATUSES.map((status) => (
                    <option key={status} value={status}>
                        {status}
                    </option>
                ))}
            </select>

            <label htmlFor='app-date'>Input Application Date (uses current date if left blank)</label>
            <input
                id='app-date'
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                type='datetime-local'
            />

            <label htmlFor='job-location'>Input Job Location (optional)</label>
            <input id='job-location' value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} />

            <label htmlFor='job-url'>Input Job Posting URL (optional)</label>
            <input id='job-url' value={jobURL} onChange={(e) => setJobURL(e.target.value)} />

            <div className={styles.submitButton}>
                <PrimaryButton variant='compact' onClick={handleAdd} disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size='sm' variant='light' /> : 'Add Job Application'}
                </PrimaryButton>
                <PrimaryButton variant='secondary' onClick={() => navigate(routes.viewApplications)}>
                    View Job Applications
                </PrimaryButton>
            </div>
        </div>
    );
};

export default AddApplication;
