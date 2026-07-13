import type { FormEvent } from 'react';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { MAX_DATETIME_LOCAL, MIN_DATETIME_LOCAL } from '../../../../helper/dateFormatter';
import { routes } from '../../../../routes';
import styles from './AddApplication.module.css';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useToast } from '../../../../components/toast/ToastProvider';
import { JOB_STATUSES, type JobStatus } from '../../models';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS, validateApplicationForm } from '../../../../helper/formValidation';

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

    const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validation = validateApplicationForm({
            applicationDate,
            applicationDateValidity: applicationDateInputRef.current?.validity,
            companyName,
            jobLocation,
            jobTitle,
            jobURL,
        });

        if (!validation.isValid) {
            showErrorToast(validation.error);
            return;
        }

        setIsLoading(true);
        try {
            const values = validation.values;
            const message = await api.application.createApplication({
                companyName: values.companyName,
                jobTitle: values.jobTitle,
                appDate: values.applicationDate,
                jobStatus,
                jobLocation: values.jobLocation,
                jobURL: values.jobURL,
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
        <form className={styles.addApplication} noValidate onSubmit={handleAdd}>
            <label htmlFor='company-name'>Company Name</label>
            <input
                id='company-name'
                maxLength={FIELD_MAX_LENGTHS.companyName}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
            />

            <label htmlFor='job-title'>Job Title</label>
            <input
                id='job-title'
                maxLength={FIELD_MAX_LENGTHS.jobTitle}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
            />

            <label htmlFor='job-status'>Job Status</label>
            <select id='job-status' value={jobStatus} onChange={(e) => setJobStatus(e.target.value as JobStatus)}>
                {JOB_STATUSES.map((status) => (
                    <option key={status} value={status}>
                        {status}
                    </option>
                ))}
            </select>

            <label htmlFor='app-date'>Application Date (uses current date if left blank)</label>
            <input
                ref={applicationDateInputRef}
                id='app-date'
                max={MAX_DATETIME_LOCAL}
                min={MIN_DATETIME_LOCAL}
                value={applicationDate}
                onChange={(e) => setApplicationDate(e.target.value)}
                type='datetime-local'
            />

            <label htmlFor='job-location'>Job Location (optional)</label>
            <input
                id='job-location'
                maxLength={FIELD_MAX_LENGTHS.location}
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
            />

            <label htmlFor='job-url'>Job Posting URL (optional)</label>
            <input
                id='job-url'
                maxLength={FIELD_MAX_LENGTHS.jobURL}
                value={jobURL}
                onChange={(e) => setJobURL(e.target.value)}
            />

            <div className={styles.submitButton}>
                <PrimaryButton isLoading={isLoading} type='submit' variant='compact'>
                    Add Job Application
                </PrimaryButton>
                <PrimaryButton type='button' variant='secondary' onClick={() => navigate(routes.viewApplications)}>
                    View Job Applications
                </PrimaryButton>
            </div>
        </form>
    );
};

export default AddApplication;
