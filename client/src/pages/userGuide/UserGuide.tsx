import type { UserGuideSection } from './models';
import Icon from '../../components/icon/Icon';
import { Link } from 'react-router-dom';
import PrimaryButton from '../../components/button/PrimaryButton';
import { routes } from '../../routes';
import styles from './UserGuide.module.css';
import { useState } from 'react';
import { FIELD_MAX_LENGTHS, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../helper/formValidation';

const guideSections: readonly UserGuideSection[] = [
    {
        id: 'account-security',
        title: 'Account security',
        icon: 'lock',
        content: (
            <>
                <h3>Creating an account</h3>
                <p>
                    Email addresses are trimmed and treated as lowercase, so capitalization does not create a separate
                    account.
                </p>
                <p>
                    Passwords must contain {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters. Spaces and Unicode
                    characters are allowed, with no required uppercase letters, numbers or symbols. Some Unicode
                    characters use multiple bytes, so the secure encoding limit may be reached before the character
                    limit.
                </p>
                <p>
                    The password-strength meter estimates how difficult the password is to guess. Its score is guidance;
                    the length and encoding limits determine whether the password can be submitted.
                </p>
                <p>
                    Repeated sign-in or sign-up attempts may be temporarily limited. Wait before trying again if the
                    rate-limit message appears.
                </p>
            </>
        ),
    },
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        content: (
            <>
                <p>The dashboard gives you a quick visual overview of your job search progress:</p>
                <ul>
                    <li>
                        <strong>Stat cards:</strong> Shows total applications, applications added this week, upcoming
                        interviews, offers received, and response rate.
                    </li>
                    <li>
                        <strong>Line chart:</strong> Shows applications added over the past eight weeks. Each x-axis
                        label is the Monday that begins that week.
                    </li>
                    <li>
                        <strong>Pie chart:</strong> Shows the distribution of applications by status, including Applied,
                        Interview, Offer and Rejected.
                    </li>
                </ul>
                <p>
                    Open it by selecting <code>Dashboard</code> from the navigation bar.
                </p>
            </>
        ),
    },
    {
        id: 'applications',
        title: 'Adding and managing applications',
        icon: 'briefcase',
        content: (
            <>
                <h3>Add a job application</h3>
                <p>
                    Enter the company name, job title and status. Application date, location and job URL are optional.
                    If the application date is blank, the current date is used.
                </p>
                <ul>
                    <li>
                        Company name is required, trimmed before saving, and limited to {FIELD_MAX_LENGTHS.companyName}{' '}
                        characters.
                    </li>
                    <li>
                        Job title is required, trimmed before saving, and limited to {FIELD_MAX_LENGTHS.jobTitle}{' '}
                        characters.
                    </li>
                    <li>The application date cannot be in the future.</li>
                    <li>
                        Job location is a separate application field and is limited to {FIELD_MAX_LENGTHS.location}{' '}
                        characters.
                    </li>
                    <li>
                        Job URLs are limited to {FIELD_MAX_LENGTHS.jobURL} characters and must use <code>http://</code>{' '}
                        or <code>https://</code> with a valid domain and suffix.
                    </li>
                </ul>
                <p>If the server rejects the submission, the entered application details remain in the form.</p>
                <h3>View job applications</h3>
                <p>
                    The application viewer lets you delete applications, edit their status and open their original job
                    posting URL. Select <code>Edit Status</code> to reveal the status menu.
                </p>
                <p>
                    Use the <strong>List</strong> and <strong>Board</strong> switch to choose between the standard card
                    list and the board layout. The active application board groups cards by status, shows the
                    application date, and lets you drag cards between columns or use the <code>Move to</code> menu to
                    update status.
                </p>
                <p>
                    Changing a status to <code>Interview</code> displays a link for creating an interview tied to that
                    application. If an interview already exists, delete it before changing the status back to{' '}
                    <code>Applied</code>. The board also prevents moving an application back to <code>Applied</code>{' '}
                    while it still has an interview.
                </p>
                <p>
                    Use <strong>Filter by</strong> to show one or more statuses, or select <code>Show All</code>. The
                    archive toggle reveals or hides the archive action for each application.
                </p>
                <p>
                    An orange <strong>Upcoming Interviews</strong> badge appears below the status when an application
                    has one or more interviews scheduled in the future.
                </p>
            </>
        ),
    },
    {
        id: 'interviews',
        title: 'Interviews',
        icon: 'interview',
        content: (
            <>
                <h3>Add an interview</h3>
                <p>
                    Interview date and interview location are required. The interview date must be after the related
                    application date.
                </p>
                <ul>
                    <li>
                        Interview location is separate from job location, but both use the same{' '}
                        {FIELD_MAX_LENGTHS.location}-character limit.
                    </li>
                    <li>Interview type is optional and limited to {FIELD_MAX_LENGTHS.interviewType} characters.</li>
                    <li>Interview notes are optional and limited to {FIELD_MAX_LENGTHS.notes} characters.</li>
                </ul>
                <p>If the server rejects the submission, the entered interview details remain in the form.</p>
                <h3>View interviews</h3>
                <p>
                    Interview records are linked to their job applications and can be deleted from the interview viewer.
                </p>
                <p>
                    Select <code>Click here to view corresponding job application</code> to return to the related
                    application. The application is scrolled into view and highlighted for four seconds. This only works
                    if the corresponding application is visible in the current filter on the applications page (e.g. if
                    the application has status <code>Interview</code>, the filter must include that status).
                </p>
                <p>
                    Both active and archived interviews are sorted with upcoming interviews first (closest date at the
                    top), followed by past interviews (earliest date first).
                </p>
            </>
        ),
    },
    {
        id: 'notes',
        title: 'Notes and visibility',
        icon: 'notes',
        content: (
            <>
                <p>
                    The notes toggle at the top of an application viewer shows or hides notes for every visible
                    application.
                </p>
                <h3>Active applications</h3>
                <p>
                    Application notes are editable, limited to {FIELD_MAX_LENGTHS.notes} characters, and automatically
                    saved after you stop typing for half a second.
                </p>
                <p>
                    Application notes and interview notes are separate fields, but both use the same{' '}
                    {FIELD_MAX_LENGTHS.notes}-character limit.
                </p>
                <h3>Archived applications</h3>
                <p>
                    Archived notes are read-only in both list and board views. Unarchive the application before making
                    further changes.
                </p>
            </>
        ),
    },
    {
        id: 'archive',
        title: 'Archive mode',
        icon: 'archive',
        content: (
            <>
                <p>
                    Select <code>Show Archived</code> to replace the active navigation links with archived applications
                    and archived interviews. Select <code>Show Active</code> to return.
                </p>
                <ul>
                    <li>
                        <strong>Archived applications:</strong> View, filter, delete or unarchive applications in list
                        or board view. Archived board cards use the same visual format as active board cards, but they
                        cannot be dragged, cannot change status, and cannot edit notes. Unarchiving also restores the
                        linked interview, if one exists.
                    </li>
                    <li>
                        <strong>Archived interviews:</strong> These are read-only. Unarchive their related application
                        to restore them. Sorted with upcoming first, past last.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'deletion',
        title: 'Deletion, archiving and restoration rules',
        icon: 'delete',
        content: (
            <>
                <ul>
                    <li>Deleting an active or archived application also deletes its linked interview.</li>
                    <li>Archiving an application automatically archives its linked interview.</li>
                    <li>Unarchiving an application automatically restores its linked interview.</li>
                    <li>Archived records are not editable until they are restored.</li>
                </ul>
                <p>
                    A confirmation dialog appears before single and bulk deletions. Deletion is permanent, so review the
                    selected records before confirming.
                </p>
            </>
        ),
    },
    {
        id: 'export-sorting',
        title: 'Exporting and sorting records',
        icon: 'export',
        content: (
            <>
                <h3>Export as CSV</h3>
                <p>
                    Application exports contain the records visible under the selected status filters. Interview and
                    archived-record viewers also provide CSV export actions under <strong>More...</strong> when at least
                    one record is available.
                </p>
                <h3>Sorting order</h3>
                <p>
                    Applications are grouped by status in this order: <code>Accepted</code>, <code>Offer</code>,{' '}
                    <code>Declined</code>, <code>Interview</code>, <code>Applied</code>, <code>Ghosted</code> and{' '}
                    <code>Rejected</code>. Within a status, the most recent application appears first. The same order is
                    used for active and archived application board columns.
                </p>
                <p>
                    Interviews are grouped with upcoming dates first (closest at the top), then past dates (earliest
                    first). This applies to both upcoming and archived interviews.
                </p>
            </>
        ),
    },
    {
        id: 'highlighting',
        title: 'Auto scroll and highlighting',
        icon: 'highlight',
        content: (
            <>
                <p>
                    Use the <strong>Auto scroll after job status change</strong> toggle under{' '}
                    <strong>Display options</strong> in list view to control scrolling behavior. When enabled (green),
                    changing the job status via the edit dropdown will automatically scroll the application into view.
                    When disabled, the page stays in place after a status change.
                </p>
                <p>
                    After a list-view status update, the application receives a green highlight for four seconds. No
                    highlight is shown when the status did not change.
                </p>
                <p>The same feedback appears when navigating from an interview to its corresponding application.</p>
            </>
        ),
    },
    {
        id: 'dark-mode',
        title: 'Dark mode',
        icon: 'darkMode',
        content: (
            <>
                <p>
                    Click the moon or sun icon in the navigation bar to switch between light and dark mode. The icon
                    appears between the archive toggle and the Logout link.
                </p>
                <p>
                    Your preference is saved to <strong>localStorage</strong> and persists across sessions. On your
                    first visit, if no saved preference is found, the app checks your operating system setting (light or
                    dark mode) and uses that.
                </p>
                <p>All colours — text, backgrounds, buttons, badges, charts and form inputs — adapt automatically.</p>
            </>
        ),
    },
];

const UserGuide = () => {
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    return (
        <main data-testid='ug' className={styles.userGuide}>
            <div className={styles.guideContainer}>
                <Link className={styles.backButton} to={routes.signIn}>
                    <Icon name='arrowBack' />
                    Back to sign in
                </Link>
                <header className={styles.header}>
                    <span className={styles.headerIcon}>
                        <Icon name='guide' />
                    </span>
                    <div>
                        <h1>Job Tracker User Guide</h1>
                        <p>Quick answers for managing applications, interviews and archived records.</p>
                    </div>
                </header>

                <div className={styles.accordion}>
                    {guideSections.map((section) => {
                        const isOpen = activeSectionId === section.id;
                        const panelId = `${section.id}-panel`;

                        return (
                            <section
                                key={section.id}
                                className={`${styles.accordionItem} ${isOpen ? styles.accordionItemOpen : ''}`}
                            >
                                <h2 className={styles.accordionHeading}>
                                    <PrimaryButton
                                        variant='navigation'
                                        className={styles.accordionButton}
                                        type='button'
                                        aria-expanded={isOpen}
                                        aria-controls={panelId}
                                        onClick={() => setActiveSectionId(isOpen ? null : section.id)}
                                    >
                                        <span className={styles.sectionIcon}>
                                            <Icon name={section.icon} />
                                        </span>
                                        <span>{section.title}</span>
                                        <Icon
                                            name='chevronDown'
                                            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                                        />
                                    </PrimaryButton>
                                </h2>
                                <div id={panelId} className={styles.accordionPanel} hidden={!isOpen}>
                                    {section.content}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <p className={styles.tip}>
                    Tip: Archive records instead of deleting them when you may need them later.
                </p>
            </div>
        </main>
    );
};

export default UserGuide;
