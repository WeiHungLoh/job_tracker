import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { JobApplication } from '../../jobApplication/models';
import type { Location } from 'react-router-dom';
import type { MouseEvent } from 'react';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { isInvalidDatetimeLocalInput, MIN_DATETIME_LOCAL, parseDatetimeLocal } from '../../../helper/dateFormatter';
import { routes } from '../../../routes';
import styles from './AddInterview.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useRef, useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';
import { getErrorToastMessage, isJobTrackerAPIError } from '../../../helper/getErrorToastMessage';
import { FIELD_MAX_LENGTHS } from '../../../helper/formValidation';

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

    const handleAdd = async (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const trimmedInterviewLocation = interviewLocation.trim();
        const trimmedInterviewType = interviewType.trim();
        const trimmedNotes = notes.trim();

        if (isInvalidDatetimeLocalInput(interviewDate, interviewDateInputRef.current?.validity)) {
            showErrorToast('Please enter a valid interview date.');
            return;
        }

        if (!interviewDate || !trimmedInterviewLocation) {
            showErrorToast('Please enter a date and location before adding an interview.');
            return;
        }

        if (trimmedInterviewLocation.length > FIELD_MAX_LENGTHS.location) {
            showErrorToast(`Interview location must be ${FIELD_MAX_LENGTHS.location} characters or fewer.`);
            return;
        }

        if (trimmedInterviewType.length > FIELD_MAX_LENGTHS.interviewType) {
            showErrorToast(`Interview type must be ${FIELD_MAX_LENGTHS.interviewType} characters or fewer.`);
            return;
        }

        if (trimmedNotes.length > FIELD_MAX_LENGTHS.notes) {
            showErrorToast(`Notes must be ${FIELD_MAX_LENGTHS.notes} characters or fewer.`);
            return;
        }

        const localDate = parseDatetimeLocal(interviewDate);
        if (localDate <= new Date(app.application_date)) {
            showErrorToast('Interview date must be after the job application date.');
            return;
        }

        setIsLoading(true);
        try {
            const message = await api.interview.createInterview({
                jobId: app.job_id,
                interviewDate: localDate,
                interviewLocation: trimmedInterviewLocation,
                interviewType: trimmedInterviewType,
                notes: trimmedNotes,
            });
            showSuccessToast(message);
            resetForm();
        } catch (error) {
            showErrorToast(getErrorToastMessage(error, 'Unable to add the interview. Please try again.'));
            if (isJobTrackerAPIError(error)) {
                resetForm();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.addInterview}>
            <div>
                <h2>You are adding an interview for:</h2>
                <p>
                    Company: <em>{app.company_name}</em>
                </p>
                <p>
                    Position: <em>{app.job_title}</em>
                </p>
            </div>

            <label htmlFor='date'>Input Interview Date</label>
            <input
                ref={interviewDateInputRef}
                id='date'
                min={MIN_DATETIME_LOCAL}
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                type='datetime-local'
                required
            />

            <label htmlFor='location'>Input Interview Location</label>
            <input
                id='location'
                maxLength={FIELD_MAX_LENGTHS.location}
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                required
                placeholder='E.g. Zoom'
            />

            <label htmlFor='type'>Input Interview Type (optional)</label>
            <input
                id='type'
                maxLength={FIELD_MAX_LENGTHS.interviewType}
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
            />

            <label htmlFor='notes'>Input Additional Notes (optional)</label>
            <input
                id='notes'
                maxLength={FIELD_MAX_LENGTHS.notes}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />

            <div className={styles.submitButton}>
                <PrimaryButton variant='compact' data-testid='add-interview' onClick={handleAdd} disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size='sm' variant='light' /> : 'Add Interview'}
                </PrimaryButton>
                <PrimaryButton variant='secondary' onClick={() => navigate(routes.viewInterviews)}>
                    View Interviews
                </PrimaryButton>
                <PrimaryButton variant='secondary' onClick={() => navigate(`${routes.viewApplications}#${app.job_id}`)}>
                    Back
                </PrimaryButton>
            </div>
        </div>
    );
};

export default AddInterview;
