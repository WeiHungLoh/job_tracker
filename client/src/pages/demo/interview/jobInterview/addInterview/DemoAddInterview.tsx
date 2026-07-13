import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { JobApplication } from '../../../../application/models';
import type { Location } from 'react-router-dom';
import type { FormEvent } from 'react';
import PrimaryButton from '../../../../../components/button/PrimaryButton';
import { MAX_DATETIME_LOCAL, MIN_DATETIME_LOCAL } from '../../../../../helper/dateFormatter';
import { DEMO_INTERVIEW_CREATED_MESSAGE } from '../../../state/demoMessages';
import { FIELD_MAX_LENGTHS, validateInterviewForm } from '../../../../../helper/formValidation';
import { routes } from '../../../../../routes';
import styles from './DemoAddInterview.module.css';
import { useDemo } from '../../../context/DemoContext';
import { useRef, useState } from 'react';
import { useToast } from '../../../../../components/toast/ToastProvider';
import {
    DEFAULT_INTERVIEW_DURATION_MINUTES,
    INTERVIEW_DURATION_MINUTES_MAX,
    INTERVIEW_DURATION_MINUTES_MIN,
} from '../../../../../helper/interviewTiming';

const DemoAddInterview = () => {
    const [interviewDate, setInterviewDate] = useState<string>('');
    const [interviewDurationMinutes, setInterviewDurationMinutes] = useState<string>(
        String(DEFAULT_INTERVIEW_DURATION_MINUTES)
    );
    const [interviewLocation, setInterviewLocation] = useState<string>('');
    const [interviewType, setInterviewType] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const interviewDateInputRef = useRef<HTMLInputElement>(null);
    const interviewDurationInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const location = useLocation() as Location<{ app?: JobApplication }>;
    const app = location.state?.app;
    const { dispatch } = useDemo();
    const { showErrorToast, showSuccessToast } = useToast();

    if (!app) {
        return <Navigate to={routes.demoViewApplications} replace />;
    }

    const resetForm = () => {
        setInterviewDate('');
        setInterviewDurationMinutes(String(DEFAULT_INTERVIEW_DURATION_MINUTES));
        setInterviewLocation('');
        setInterviewType('');
        setNotes('');
    };

    const handleAdd = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validation = validateInterviewForm({
            applicationDate: app.application_date,
            interviewDate,
            interviewDateValidity: interviewDateInputRef.current?.validity,
            interviewDurationMinutes,
            interviewDurationValidity: interviewDurationInputRef.current?.validity,
            interviewLocation,
            interviewType,
            notes,
        });

        if (!validation.isValid) {
            showErrorToast(validation.error);
            return;
        }

        const values = validation.values;
        dispatch({
            type: 'CREATE_INTERVIEW',
            payload: {
                jobId: app.job_id,
                interviewDate: values.interviewDate,
                interviewDurationMinutes: values.interviewDurationMinutes,
                interviewLocation: values.interviewLocation,
                interviewType: values.interviewType,
                notes: values.notes,
            },
        });
        showSuccessToast(DEMO_INTERVIEW_CREATED_MESSAGE);
        resetForm();
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

            <label htmlFor='duration'>Duration (minutes)</label>
            <input
                ref={interviewDurationInputRef}
                id='duration'
                max={INTERVIEW_DURATION_MINUTES_MAX}
                min={INTERVIEW_DURATION_MINUTES_MIN}
                step='1'
                type='number'
                value={interviewDurationMinutes}
                onChange={(event) => setInterviewDurationMinutes(event.target.value)}
                required
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
                <PrimaryButton type='submit' variant='compact' data-testid='add-interview'>
                    Add Interview
                </PrimaryButton>
                <PrimaryButton type='button' variant='secondary' onClick={() => navigate(routes.demoViewInterviews)}>
                    View Interviews
                </PrimaryButton>
                <PrimaryButton
                    type='button'
                    variant='secondary'
                    onClick={() => navigate(`${routes.demoViewApplications}#${app.job_id}`)}
                >
                    Back
                </PrimaryButton>
            </div>
        </form>
    );
};

export default DemoAddInterview;
