import type { FormEvent } from 'react';
import FormFieldError from '../../../../components/formPage/FormFieldError';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { focusFirstInvalidField } from '../../../../components/formPage/focusFirstInvalidField';
import { useFormErrors } from '../../../../components/formPage/useFormErrors';
import { MAX_DATETIME_LOCAL, MIN_DATETIME_LOCAL } from '../../../../helper/dateFormatter';
import { routes } from '../../../../routes';
import styles from './AddApplication.module.css';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRef, useState } from 'react';
import { useToast } from '../../../../components/toast/ToastProvider';
import { JOB_STATUSES, type CreateApplicationRequest, type JobStatus } from '../../models';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import {
    FIELD_MAX_LENGTHS,
    type ApplicationFormField,
    validateApplicationForm,
} from '../../../../helper/formValidation';
import { useConfirm } from 'material-ui-confirm';
import { isDuplicateApplicationError } from '../../possibleDuplicateApplication';
import { createDuplicateApplicationConfirmation } from '../../../../helper/duplicateApplicationConfirmation';
import {
    MAX_CAPTURED_PAGE_TITLE_LENGTH,
    QUICK_CAPTURE_JOB_URL_PARAM,
    QUICK_CAPTURE_PAGE_TITLE_PARAM,
} from '../quickCapture';

const AddApplication = () => {
    const [searchParams] = useSearchParams();
    const capturedPageTitle = (searchParams.get(QUICK_CAPTURE_PAGE_TITLE_PARAM) ?? '')
        .trim()
        .slice(0, MAX_CAPTURED_PAGE_TITLE_LENGTH);
    const [companyName, setCompanyName] = useState<string>('');
    const [jobTitle, setJobTitle] = useState<string>('');
    const [jobStatus, setJobStatus] = useState<JobStatus>('Applied');
    const [applicationDate, setApplicationDate] = useState<string>('');
    const [jobLocation, setJobLocation] = useState<string>('');
    const [jobURL, setJobURL] = useState<string>(() => searchParams.get(QUICK_CAPTURE_JOB_URL_PARAM) ?? '');
    const { clearFieldError, errors, setErrors } = useFormErrors<ApplicationFormField>();
    const companyNameInputRef = useRef<HTMLInputElement>(null);
    const jobTitleInputRef = useRef<HTMLInputElement>(null);
    const applicationDateInputRef = useRef<HTMLInputElement>(null);
    const jobLocationInputRef = useRef<HTMLInputElement>(null);
    const jobURLInputRef = useRef<HTMLInputElement>(null);
    const pendingSubmissionRef = useRef(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const api = useJobTrackerAPI();
    const confirm = useConfirm();
    const { showErrorToast, showSuccessToast } = useToast();

    const resetForm = () => {
        setCompanyName('');
        setJobTitle('');
        setJobStatus('Applied');
        setApplicationDate('');
        setJobLocation('');
        setJobURL('');
        setErrors({});
    };

    const submitApplication = async (request: CreateApplicationRequest): Promise<string | undefined> => {
        try {
            return await api.application.createApplication(request);
        } catch (error) {
            if (!isDuplicateApplicationError(error)) {
                throw error;
            }

            const { confirmed } = await confirm(createDuplicateApplicationConfirmation(error.data.duplicate));
            if (!confirmed) {
                return undefined;
            }

            return await api.application.createApplication({ ...request, allowDuplicate: true });
        }
    };

    const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (pendingSubmissionRef.current) {
            return;
        }

        const validation = validateApplicationForm({
            applicationDate,
            applicationDateValidity: applicationDateInputRef.current?.validity,
            companyName,
            jobLocation,
            jobTitle,
            jobURL,
        });

        if (!validation.isValid) {
            setErrors(validation.errors);
            focusFirstInvalidField<ApplicationFormField>(validation.errors, [
                ['companyName', companyNameInputRef],
                ['jobTitle', jobTitleInputRef],
                ['applicationDate', applicationDateInputRef],
                ['jobLocation', jobLocationInputRef],
                ['jobURL', jobURLInputRef],
            ]);
            return;
        }

        const values = validation.values;
        const request: CreateApplicationRequest = {
            companyName: values.companyName,
            jobTitle: values.jobTitle,
            appDate: values.applicationDate,
            jobStatus,
            jobLocation: values.jobLocation,
            jobURL: values.jobURL,
        };

        pendingSubmissionRef.current = true;
        setIsLoading(true);
        try {
            const message = await submitApplication(request);
            if (message === undefined) {
                return;
            }

            showSuccessToast(message);
            resetForm();
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to add the job application. Please try again.'));
        } finally {
            pendingSubmissionRef.current = false;
            setIsLoading(false);
        }
    };

    return (
        <form className={styles.addApplication} noValidate onSubmit={handleAdd}>
            {capturedPageTitle && (
                <section className={styles.capturedPageTitle} aria-labelledby='captured-page-title-label'>
                    <p id='captured-page-title-label' className={styles.capturedPageTitleLabel}>
                        Captured page title
                    </p>
                    <p className={styles.capturedPageTitleValue}>{capturedPageTitle}</p>
                    <p className={styles.capturedPageTitleHelp}>
                        Use this as a reference and verify the company and job title below.
                    </p>
                </section>
            )}
            <label htmlFor='company-name'>Company Name</label>
            <input
                ref={companyNameInputRef}
                aria-describedby={errors.companyName ? 'company-name-error' : undefined}
                aria-invalid={errors.companyName ? true : undefined}
                id='company-name'
                maxLength={FIELD_MAX_LENGTHS.companyName}
                value={companyName}
                onChange={(e) => {
                    setCompanyName(e.target.value);
                    clearFieldError('companyName');
                }}
                required
            />
            <FormFieldError id='company-name-error' message={errors.companyName} />

            <label htmlFor='job-title'>Job Title</label>
            <input
                ref={jobTitleInputRef}
                aria-describedby={errors.jobTitle ? 'job-title-error' : undefined}
                aria-invalid={errors.jobTitle ? true : undefined}
                id='job-title'
                maxLength={FIELD_MAX_LENGTHS.jobTitle}
                value={jobTitle}
                onChange={(e) => {
                    setJobTitle(e.target.value);
                    clearFieldError('jobTitle');
                }}
                required
            />
            <FormFieldError id='job-title-error' message={errors.jobTitle} />

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
                aria-describedby={errors.applicationDate ? 'app-date-error' : undefined}
                aria-invalid={errors.applicationDate ? true : undefined}
                id='app-date'
                max={MAX_DATETIME_LOCAL}
                min={MIN_DATETIME_LOCAL}
                value={applicationDate}
                onChange={(e) => {
                    setApplicationDate(e.target.value);
                    clearFieldError('applicationDate');
                }}
                type='datetime-local'
            />
            <FormFieldError id='app-date-error' message={errors.applicationDate} />

            <label htmlFor='job-location'>Job Location (optional)</label>
            <input
                ref={jobLocationInputRef}
                aria-describedby={errors.jobLocation ? 'job-location-error' : undefined}
                aria-invalid={errors.jobLocation ? true : undefined}
                id='job-location'
                maxLength={FIELD_MAX_LENGTHS.location}
                value={jobLocation}
                onChange={(e) => {
                    setJobLocation(e.target.value);
                    clearFieldError('jobLocation');
                }}
            />
            <FormFieldError id='job-location-error' message={errors.jobLocation} />

            <label htmlFor='job-url'>Job Posting URL (optional)</label>
            <input
                ref={jobURLInputRef}
                aria-describedby={errors.jobURL ? 'job-url-error' : undefined}
                aria-invalid={errors.jobURL ? true : undefined}
                id='job-url'
                maxLength={FIELD_MAX_LENGTHS.jobURL}
                value={jobURL}
                onChange={(e) => {
                    setJobURL(e.target.value);
                    clearFieldError('jobURL');
                }}
            />
            <FormFieldError id='job-url-error' message={errors.jobURL} />

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
