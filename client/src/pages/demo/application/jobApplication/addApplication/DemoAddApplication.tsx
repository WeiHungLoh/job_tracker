import type { MouseEvent } from 'react';
import PrimaryButton from '../../../../../components/button/PrimaryButton';
import { MAX_DATETIME_LOCAL, MIN_DATETIME_LOCAL } from '../../../../../helper/dateFormatter';
import { FIELD_MAX_LENGTHS, validateApplicationForm } from '../../../../../helper/formValidation';
import { JOB_STATUSES, type JobStatus } from '../../../../application/models';
import { DEMO_APPLICATION_CREATED_MESSAGE } from '../../../state/demoMessages';
import { routes } from '../../../../../routes';
import styles from './DemoAddApplication.module.css';
import { useDemo } from '../../../context/DemoContext';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useToast } from '../../../../../components/toast/ToastProvider';

const DemoAddApplication = () => {
    const [companyName, setCompanyName] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobStatus, setJobStatus] = useState<JobStatus>('Applied');
    const [applicationDate, setApplicationDate] = useState<string>('');
    const [jobLocation, setJobLocation] = useState<string>('');
    const [jobURL, setJobURL] = useState<string>('');
    const applicationDateInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { dispatch } = useDemo();
    const { showErrorToast, showSuccessToast } = useToast();

    const resetForm = () => {
        setCompanyName('');
        setJobTitle('');
        setJobStatus('Applied');
        setApplicationDate('');
        setJobLocation('');
        setJobURL('');
    };

    const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
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

        const values = validation.values;
        dispatch({
            type: 'CREATE_APPLICATION',
            payload: {
                companyName: values.companyName,
                jobTitle: values.jobTitle,
                applicationDate: values.applicationDate,
                jobStatus,
                jobLocation: values.jobLocation,
                jobURL: values.jobURL,
            },
        });
        showSuccessToast(DEMO_APPLICATION_CREATED_MESSAGE);
        resetForm();
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
                <PrimaryButton variant='compact' onClick={handleAdd}>
                    Add Job Application
                </PrimaryButton>
                <PrimaryButton variant='secondary' onClick={() => navigate(routes.demoViewApplications)}>
                    View Job Applications
                </PrimaryButton>
            </div>
        </div>
    );
};

export default DemoAddApplication;
