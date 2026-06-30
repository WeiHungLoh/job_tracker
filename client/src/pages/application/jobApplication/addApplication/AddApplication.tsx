import type { MouseEvent } from 'react';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import {
    isInvalidDatetimeLocalInput,
    MAX_DATETIME_LOCAL,
    MIN_DATETIME_LOCAL,
    parseDatetimeLocal,
} from '../../../../helper/dateFormatter';
import { routes } from '../../../../routes';
import styles from './AddApplication.module.css';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useToast } from '../../../../components/toast/ToastProvider';
import { JOB_STATUSES, type JobStatus } from '../../models';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS, isValidHttpURL } from '../../../../helper/formValidation';

const AddApplication = () => {
    const [companyName, setCompanyName] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobStatus, setJobStatus] = useState<JobStatus>('Applied');
    const [applicationDate, setApplicationDate] = useState<string>('');
    const [jobLocation, setJobLocation] = useState<string>('');
    const [jobURL, setJobURL] = useState<string>('');
    const applicationDateInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
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

    const handleAdd = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const trimmedCompanyName = companyName.trim();
        const trimmedJobTitle = jobTitle.trim();
        const trimmedJobLocation = jobLocation.trim();
        const trimmedJobURL = jobURL.trim();

        if (!trimmedCompanyName || !trimmedJobTitle) {
            showErrorToast('Please enter company name and job title before adding a job application.');
            return;
        }

        if (trimmedCompanyName.length > FIELD_MAX_LENGTHS.companyName) {
            showErrorToast(`Company name must be ${FIELD_MAX_LENGTHS.companyName} characters or fewer.`);
            return;
        }

        if (trimmedJobTitle.length > FIELD_MAX_LENGTHS.jobTitle) {
            showErrorToast(`Job title must be ${FIELD_MAX_LENGTHS.jobTitle} characters or fewer.`);
            return;
        }

        if (trimmedJobLocation.length > FIELD_MAX_LENGTHS.location) {
            showErrorToast(`Job location must be ${FIELD_MAX_LENGTHS.location} characters or fewer.`);
            return;
        }

        if (trimmedJobURL.length > FIELD_MAX_LENGTHS.jobURL) {
            showErrorToast(`Job URL must be ${FIELD_MAX_LENGTHS.jobURL} characters or fewer.`);
            return;
        }

        if (isInvalidDatetimeLocalInput(applicationDate, applicationDateInputRef.current?.validity)) {
            showErrorToast('Please enter a valid application date.');
            return;
        }

        const currentDate = new Date();
        const appDate = applicationDate ? parseDatetimeLocal(applicationDate) : currentDate;

        if (appDate > currentDate) {
            showErrorToast('Application date cannot be later than the current date.');
            return;
        }

        if (trimmedJobURL && !isValidHttpURL(trimmedJobURL)) {
            showErrorToast('URL must be in a valid format.');
            return;
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
            showErrorToast(getErrorToastMessage(error, 'Unable to add the job application. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.addApplication}>
            <br />
            <label htmlFor='company-name'>Input Company Name</label>
            <input
                id='company-name'
                maxLength={FIELD_MAX_LENGTHS.companyName}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
            />

            <label htmlFor='job-title'>Input Job Title</label>
            <input
                id='job-title'
                maxLength={FIELD_MAX_LENGTHS.jobTitle}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
            />

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
                ref={applicationDateInputRef}
                id='app-date'
                max={MAX_DATETIME_LOCAL}
                min={MIN_DATETIME_LOCAL}
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                type='datetime-local'
            />

            <label htmlFor='job-location'>Input Job Location (optional)</label>
            <input
                id='job-location'
                maxLength={FIELD_MAX_LENGTHS.location}
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
            />

            <label htmlFor='job-url'>Input Job Posting URL (optional)</label>
            <input
                id='job-url'
                maxLength={FIELD_MAX_LENGTHS.jobURL}
                value={jobURL}
                onChange={(e) => setJobURL(e.target.value)}
            />

            <div className={styles.submitButton}>
                <PrimaryButton isLoading={isLoading} variant='compact' onClick={handleAdd}>
                    Add Job Application
                </PrimaryButton>
                <PrimaryButton variant='secondary' onClick={() => navigate(routes.viewApplications)}>
                    View Job Applications
                </PrimaryButton>
            </div>
        </div>
    );
};

export default AddApplication;
