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

describe('InterviewCard calendar options', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    test('shows Add to calendar only for a future active interview', () => {
        renderJobCard();

        expect(screen.getByRole('button', { name: /add to calendar/i })).toBeInTheDocument();
    });

    test('does not show Add to calendar for a past active interview', () => {
        renderJobCard({ ...futureInterview, interview_date: '2020-01-01T00:00:00Z' });

        expect(screen.queryByRole('button', { name: /add to calendar/i })).not.toBeInTheDocument();
    });

    test('does not show Add to calendar for an invalid active interview date', () => {
        renderJobCard({ ...futureInterview, interview_date: 'not-a-date' });

        expect(screen.queryByRole('button', { name: /add to calendar/i })).not.toBeInTheDocument();
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
                    index={0}
                    interview={archivedInterview}
                    isDeleting={false}
                    onDelete={vi.fn()}
                    onViewApplicationClick={vi.fn()}
                    variant='archived'
                />
            </MemoryRouter>
        );

        expect(screen.queryByRole('button', { name: /add to calendar/i })).not.toBeInTheDocument();
    });

    test('opens both calendar actions and Google Calendar in a protected new tab', async () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        renderJobCard();

        await userEvent.click(screen.getByRole('button', { name: /add to calendar/i }));

        expect(screen.getByRole('menuitem', { name: 'Google Calendar' })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: 'Apple Calendar / Outlook (.ics)' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('menuitem', { name: 'Google Calendar' }));

        expect(open).toHaveBeenCalledWith(
            expect.stringContaining('https://calendar.google.com/calendar/render?'),
            '_blank',
            'noopener,noreferrer'
        );
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
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

        await userEvent.click(screen.getByRole('button', { name: /add to calendar/i }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Apple Calendar / Outlook (.ics)' }));

        expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
        expect(anchorClick).toHaveBeenCalledOnce();
        expect(downloadedFilename).toBe('Acme-Technical-Interview.ics');
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:calendar-event');
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('shows the standard frontend error toast when calendar creation fails', async () => {
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: vi.fn(() => {
                throw new Error('Unable to create object URL');
            }),
        });
        renderJobCard();

        await userEvent.click(screen.getByRole('button', { name: /add to calendar/i }));
        await userEvent.click(screen.getByRole('menuitem', { name: 'Apple Calendar / Outlook (.ics)' }));

        expect(await screen.findByText('Unable to create the calendar event. Please try again.')).toBeInTheDocument();
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('closes on Escape, restores trigger focus, and closes on outside click', async () => {
        renderJobCard();
        const trigger = screen.getByRole('button', { name: /add to calendar/i });

        await userEvent.click(trigger);
        fireEvent.keyDown(document, { key: 'Escape' });

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();

        await userEvent.click(trigger);
        fireEvent.mouseDown(document.body);

        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    test('preserves the existing Delete action', async () => {
        const { onDelete } = renderJobCard();

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledOnce();
    });
});
