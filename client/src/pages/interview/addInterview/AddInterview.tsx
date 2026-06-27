import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { JobApplication } from '../../jobApplication/models';
import { JobTrackerAPIError } from '../../../api/models';
import type { Location } from 'react-router-dom';
import type { MouseEvent } from 'react';
import LoadingSpinner from '../../../components/loadingSpinner/LoadingSpinner';
import PrimaryButton from '../../../components/button/PrimaryButton';
import { parseDatetimeLocal } from '../../../helper/dateFormatter';
import { routes } from '../../../routes';
import styles from './AddInterview.module.css';
import { useJobTrackerAPI } from '../../../api/useJobTrackerAPI';
import { useState } from 'react';
import { useToast } from '../../../components/toast/ToastProvider';

const AddInterview = () => {
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewLocation, setInterviewLocation] = useState('');
    const [interviewType, setInterviewType] = useState('');
    const [notes, setNotes] = useState('');
    const navigate = useNavigate();
    const location = useLocation() as Location<{ app?: JobApplication }>;
    // Receives the state that has been passed when user clicks 'Click here to add an interview' button
    const app = location.state?.app;
    const [isLoading, setIsLoading] = useState(false);
    const api = useJobTrackerAPI();
    const { showErrorToast, showSuccessToast } = useToast();

    // Forbids users from adding interview without clicking 'Click here to add an interview' button
    if (!app) {
        return <Navigate to={routes.viewApplications} replace />;
    }

    const resetForm = () => {
        setInterviewDate('');
        setInterviewLocation('');
        setInterviewType('');
        setNotes('');
    };

    const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const trimmedInterviewLocation = interviewLocation.trim();
        const trimmedInterviewType = interviewType.trim();
        const trimmedNotes = notes.trim();

        if (!interviewDate || !trimmedInterviewLocation) {
            showErrorToast('Please enter date and location before adding an interview');
            return;
        }

        const localDate = parseDatetimeLocal(interviewDate);

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
            if (error instanceof JobTrackerAPIError) {
                showErrorToast(error.message);
                resetForm();
                setIsLoading(false);
                return;
            }
            showErrorToast('Failed to add an interview: ' + (error as Error).message);
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
                id='date'
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                type='datetime-local'
                required
            />

            <label htmlFor='location'>Input Interview Location</label>
            <input
                id='location'
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                required
                placeholder='E.g. Zoom'
            />

            <label htmlFor='type'>Input Interview Type (optional)</label>
            <input id='type' value={interviewType} onChange={(e) => setInterviewType(e.target.value)} />

            <label htmlFor='notes'>Input Additional Notes (optional)</label>
            <input id='notes' value={notes} onChange={(e) => setNotes(e.target.value)} />

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
