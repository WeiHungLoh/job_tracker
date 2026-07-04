import ControlDropdown from '../../../components/activityControls/ControlDropdown';
import Icon from '../../../components/icon/Icon';
import { useToast } from '../../../components/toast/ToastProvider';
import type { JobInterview } from '../models';
import { buildCalendarEventDetails, buildGoogleCalendarUrl, downloadIcsEvent } from './calendarEvent';
import styles from './CalendarOptions.module.css';

type CalendarOptionsProps = {
    interview: JobInterview;
};

const CALENDAR_ERROR_MESSAGE = 'Unable to create the calendar event. Please try again.';

const CalendarOptions = ({ interview }: CalendarOptionsProps) => {
    const { showErrorToast } = useToast();

    const handleGoogleCalendar = () => {
        try {
            const event = buildCalendarEventDetails(interview);
            window.open(buildGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
        } catch {
            showErrorToast(CALENDAR_ERROR_MESSAGE);
        }
    };

    const handleIcsDownload = () => {
        try {
            downloadIcsEvent(buildCalendarEventDetails(interview));
        } catch {
            showErrorToast(CALENDAR_ERROR_MESSAGE);
        }
    };

    return (
        <ControlDropdown
            closeOnSelect
            containerClassName={styles.container}
            dropdownAriaLabel='Calendar options'
            dropdownClassName={styles.menu}
            dropdownRole='menu'
            id={`calendar-${interview.interview_id}`}
            label={
                <>
                    <Icon name='calendar' size={17} />
                </>
            }
            triggerClassName={styles.trigger}
            triggerVariant='secondary'
        >
            <button className={styles.menuItem} onClick={handleGoogleCalendar} role='menuitem' type='button'>
                Add to Google Calendar
            </button>
            <button className={styles.menuItem} onClick={handleIcsDownload} role='menuitem' type='button'>
                Add to Apple Calendar / Outlook (.ics)
            </button>
        </ControlDropdown>
    );
};

export default CalendarOptions;
