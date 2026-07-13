import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { JobApplication } from '../../../application/models';
import type { Location } from 'react-router-dom';
import type { FormEvent } from 'react';
import PrimaryButton from '../../../../components/button/PrimaryButton';
import { MAX_DATETIME_LOCAL, MIN_DATETIME_LOCAL } from '../../../../helper/dateFormatter';
import { routes } from '../../../../routes';
import styles from './AddInterview.module.css';
import { useJobTrackerAPI } from '../../../../api/useJobTrackerAPI';
import { useRef, useState } from 'react';
import { useToast } from '../../../../components/toast/ToastProvider';
import { getErrorToastMessage } from '../../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS, validateInterviewForm } from '../../../../helper/formValidation';

const AddInterview = () => {
    const [interviewDate, setInterviewDate] = useState<string>('');
    const [interviewLocation, setInterviewLocation] = useState<string>('');
    const [interviewType, setInterviewType] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const interviewDateInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation() as Location<{ app?: JobApplication }>;
    const app = location.state?.app;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const api = useJobTrackerAPI();
    const { showErrorToast, showSuccessToast } = useToast();

    if (!app) {
        return <Navigate to={routes.viewApplications} replace />;
    }

    const resetForm = () => {
        setInterviewDate('');
        setInterviewLocation('');
        setInterviewType('');
        setNotes('');
    };

    const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validation = validateInterviewForm({
            applicationDate: app.application_date,
            interviewDate,
            interviewDateValidity: interviewDateInputRef.current?.validity,
            interviewLocation,
            interviewType,
            notes,
        });

        if (!validation.isValid) {
            showErrorToast(validation.error);
            return;
        }

        setIsLoading(true);
        try {
            const values = validation.values;
            const message = await api.interview.createInterview({
                jobId: app.job_id,
                interviewDate: values.interviewDate,
                interviewLocation: values.interviewLocation,
                interviewType: values.interviewType,
                notes: values.notes,
            });
            showSuccessToast(message);
            resetForm();
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to add the interview. Please try again.'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={styles.addInterview} noValidate onSubmit={handleAdd}>
            <div className={styles.context}>
                <h2>You are adding an interview for:</h2>
                <p>
                    Company: <em>{app.company_name}</em>
                </p>
                <p>
                    Position: <em>{app.job_title}</em>
                </p>
            </div>

            <label htmlFor='date'>Interview Date</label>
            <input
                ref={interviewDateInputRef}
                id='date'
                max={MAX_DATETIME_LOCAL}
                min={MIN_DATETIME_LOCAL}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                type='datetime-local'
                required
            />

            <label htmlFor='location'>Interview Location</label>
            <input
                id='location'
                maxLength={FIELD_MAX_LENGTHS.location}
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                required
                placeholder='E.g. Zoom'
            />

            <label htmlFor='type'>Interview Type (optional)</label>
            <input
                id='type'
                maxLength={FIELD_MAX_LENGTHS.interviewType}
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
            />

            <label htmlFor='notes'>Additional Notes (optional)</label>
            <input
                id='notes'
                maxLength={FIELD_MAX_LENGTHS.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />

            <div className={styles.submitButton}>
                <PrimaryButton isLoading={isLoading} type='submit' variant='compact' data-testid='add-interview'>
                    Add Interview
                </PrimaryButton>
                <PrimaryButton type='button' variant='secondary' onClick={() => navigate(routes.viewInterviews)}>
                    View Interviews
                </PrimaryButton>
                <PrimaryButton
                    type='button'
                    variant='secondary'
                    onClick={() => navigate(`${routes.viewApplications}#${app.job_id}`)}
                >
                    Back
                </PrimaryButton>
            </div>
        </form>
    );
};

export default AddInterview;
