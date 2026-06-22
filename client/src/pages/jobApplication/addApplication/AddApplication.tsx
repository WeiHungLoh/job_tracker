import { JobTrackerAPIError } from '../../../api/models';
import type { MouseEvent } from 'react';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { routes } from '../../../routes';
import styles from './AddApplication.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';
import type { JobStatus } from '../models';

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

    const isAppDatePresent = (appDate: string) => {
        if (appDate === '') {
            return currDate;
        }
        // datetime-local displays in the format of YYYY-MM-DDThh:mm:sssZ
        const [year, month, day, hour, minute] = appDate.split(/[-T:]/);
        // Decrements month by 1 since month starts from 0
        const localDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
        return localDate;
    };

    const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (companyName === '' || jobTitle === '') {
            showErrorToast('Please enter company name and job title before adding a job application');
            return;
        }

        const appDate = isAppDatePresent(applicationDate);

        if (appDate > currDate) {
            showErrorToast('Application date cannot be later than current date');
            return;
        }

        setIsLoading(true);
        try {
            const message = await api.application.createApplication({
                companyName,
                jobTitle,
                appDate,
                jobStatus,
                jobLocation,
                jobURL,
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
            <br/>
            <label htmlFor='company-name'>Input Company Name</label>
            <input id='company-name' value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

            <label htmlFor='job-title'>Input Job Title</label>
            <input id='job-title' value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />

            <label>Input Job Status</label>
            <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value as JobStatus)}>
                <option value='Accepted'>Accepted</option>
                <option value='Applied'>Applied</option>
                <option value='Declined'>Declined</option>
                <option value='Ghosted'>Ghosted</option>
                <option value='Interview'>Interview</option>
                <option value='Offer'>Offer</option>
                <option value='Rejected'>Rejected</option>
            </select>

            <label htmlFor='app-date'>Input Application Date (uses current date if left blank)</label>
            <input
                id='app-date'
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                type='datetime-local'
            />

            <label>Input Job Location (optional)</label>
            <input value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} />

            <label>Input Job Posting URL (optional)</label>
            <input value={jobURL} onChange={(e) => setJobURL(e.target.value)} />

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
