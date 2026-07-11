import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import InterviewCard from '../../pages/interview/InterviewCard';
import type { ArchivedJobInterview, JobInterview } from '../../pages/interview/models';
import { render } from '../renderWithToast';

const futureInterview: JobInterview = {
    company_name: 'Acme',
    interview_date: '2099-08-15T09:30:00Z',
    interview_id: 42,
    interview_location: 'Singapore',
    interview_notes: 'Bring examples',
    interview_type: 'Technical Interview',
    job_id: 7,
    job_title: 'Software Engineer',
};

const renderJobCard = (interview: JobInterview = futureInterview, onDelete = vi.fn()) => {
    render(
        <MemoryRouter>
            <InterviewCard
                applicationRoute='/application/view'
                index={0}
                interview={interview}
                isDeleting={false}
                onDelete={onDelete}
                onViewApplicationClick={vi.fn()}
                variant='job'
            />
        </MemoryRouter>
    );

    return { onDelete };
};

const getCalendarTrigger = () => screen.getByRole('button', { name: 'Add to calendar' });

const queryCalendarTrigger = () => screen.queryByRole('button', { name: 'Add to calendar' });

describe('InterviewCard calendar options', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test('shows Add to calendar only for a future active interview', () => {
        renderJobCard();

        expect(getCalendarTrigger()).toBeInTheDocument();
    });

    test('does not show Add to calendar for a past active interview', () => {
        renderJobCard({ ...futureInterview, interview_date: '2020-01-01T00:00:00Z' });

        expect(queryCalendarTrigger()).not.toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Acme interview' }).className).toContain('overdue');
    });

    test('does not show Add to calendar for an invalid active interview date', () => {
        renderJobCard({ ...futureInterview, interview_date: 'not-a-date' });

        expect(queryCalendarTrigger()).not.toBeInTheDocument();
        expect(screen.getByRole('article', { name: 'Acme interview' }).className).not.toContain('overdue');
    });

    test('combines Board and overdue styling for a past interview', () => {
        render(
            <MemoryRouter>
                <InterviewCard
                    applicationRoute='/application/view'
                    index={0}
                    interview={{ ...futureInterview, interview_date: '2020-01-01T00:00:00Z' }}
                    isDeleting={false}
                    layout='board'
                    onDelete={vi.fn()}
                    onViewApplicationClick={vi.fn()}
                    variant='job'
                />
            </MemoryRouter>
        );

        const card = screen.getByRole('article', { name: 'Acme interview' });
        expect(card.className).toContain('board');
        expect(card.className).toContain('overdue');
    });

    test('does not show Add to calendar for an archived interview', () => {
        const archivedInterview: ArchivedJobInterview = {
            ...futureInterview,
            archived_interview_id: 42,
            archived_job_id: 7,
        };

        render(
            <MemoryRouter>
                <InterviewCard
                    applicationRoute='/application/archived'
                    index={0}
                    interview={archivedInterview}
                    isDeleting={false}
                    onDelete={vi.fn()}
                    onViewApplicationClick={vi.fn()}
                    variant='archived'
                />
            </MemoryRouter>
        );

        expect(queryCalendarTrigger()).not.toBeInTheDocument();
    });

    test('opens both calendar actions and Google Calendar in a protected new tab', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        renderJobCard();
        const trigger = getCalendarTrigger();

        await userEvent.click(trigger);

        const googleCalendarAction = screen.getByRole('button', { name: 'Add to Google Calendar' });
        expect(screen.getByRole('group', { name: 'Calendar options' })).toBeInTheDocument();
        expect(googleCalendarAction).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add to Apple Calendar / Outlook (.ics)' })).toBeInTheDocument();

        await userEvent.tab();
        expect(googleCalendarAction).toHaveFocus();
        await userEvent.click(googleCalendarAction);

        expect(open).toHaveBeenCalledWith(
            expect.stringContaining('https://calendar.google.com/calendar/render?'),
            '_blank',
            'noopener,noreferrer'
        );
        expect(screen.queryByRole('group', { name: 'Calendar options' })).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
    });

    test('downloads an iCalendar file and revokes its temporary URL', async () => {
        const createObjectURL = vi.fn(() => 'blob:calendar-event');
        const revokeObjectURL = vi.fn();
        let downloadedFilename = '';
        Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
        const anchorClick = vi
            .spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(function (this: HTMLAnchorElement) {
                downloadedFilename = this.download;
            });
        renderJobCard();

        await userEvent.click(getCalendarTrigger());
        await userEvent.click(screen.getByRole('button', { name: 'Add to Apple Calendar / Outlook (.ics)' }));

        expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(anchorClick).toHaveBeenCalledOnce();
        expect(downloadedFilename).toBe('Acme-Technical-Interview.ics');
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:calendar-event');
        expect(screen.queryByRole('group', { name: 'Calendar options' })).not.toBeInTheDocument();
    });

    test('shows the standard frontend error toast when calendar creation fails', async () => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => {
                throw new Error('Unable to create object URL');
            }),
        });
        renderJobCard();

        await userEvent.click(getCalendarTrigger());
        await userEvent.click(screen.getByRole('button', { name: 'Add to Apple Calendar / Outlook (.ics)' }));

        expect(await screen.findByText('Unable to create the calendar event. Please try again.')).toBeInTheDocument();
        expect(screen.queryByRole('group', { name: 'Calendar options' })).not.toBeInTheDocument();
    });

    test('closes on Escape, restores trigger focus, and closes on outside click', async () => {
        renderJobCard();
        const trigger = getCalendarTrigger();

        await userEvent.click(trigger);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('group', { name: 'Calendar options' })).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();

        await userEvent.click(trigger);
        fireEvent.mouseDown(document.body);

        expect(screen.queryByRole('group', { name: 'Calendar options' })).not.toBeInTheDocument();
    });

    test('preserves the existing Delete action', async () => {
        const { onDelete } = renderJobCard();

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledOnce();
    });

    test('uses shared Board actions and hides List-only interview details', async () => {
        render(
            <MemoryRouter>
                <InterviewCard
                    applicationRoute='/demo/application/view'
                    index={0}
                    interview={futureInterview}
                    isDeleting={false}
                    layout='board'
                    onDelete={vi.fn()}
                    onViewApplicationClick={vi.fn()}
                    variant='job'
                />
            </MemoryRouter>
        );

        expect(screen.getByRole('article', { name: 'Acme interview' })).toBeInTheDocument();
        expect(screen.queryByText('Notes: Bring examples')).not.toBeInTheDocument();
        expect(screen.queryByText(/time left/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /review corresponding job application/i })).not.toBeInTheDocument();
        const actions = screen.getByText('Actions').closest('details');
        expect(actions).not.toHaveAttribute('open');

        await userEvent.click(screen.getByText('Actions'));

        expect(actions).toHaveAttribute('open');
        expect(getCalendarTrigger()).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete' }).parentElement?.className).toContain('compactActions');
    });
});
