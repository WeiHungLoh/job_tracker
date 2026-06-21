import type { UserGuideSection } from './models';
import Icon from '../../components/icon/Icon';
import PrimaryButton from '../../components/button/PrimaryButton';
import styles from './UserGuide.module.css';
import { useState } from 'react';

const guideSections: readonly UserGuideSection[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        icon: 'dashboard',
        content: (
            <>
                <p>The dashboard gives you a quick visual overview of your job search progress:</p>
                <ul>
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
                <h3>View job applications</h3>
                <p>
                    The application viewer lets you delete applications, edit their status and open their original job
                    posting URL. Select <code>Edit Status</code> to reveal the status menu.
                </p>
                <p>
                    Changing a status to <code>Interview</code> displays a link for creating an interview tied to that
                    application. If an interview already exists, delete it before changing the status back to{' '}
                    <code>Applied</code>.
                </p>
                <p>
                    Use <strong>Filter by</strong> to show one status or select <code>Show All</code>. The archive
                    toggle reveals or hides the archive action for each application.
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
                <p>
                    Interview records are linked to their job applications and can be deleted from the interview viewer.
                </p>
                <p>
                    Select <code>Click here to view corresponding job application</code> to return to the related
                    application. The application is scrolled into view and highlighted for four seconds.
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
                <p>Notes are editable and automatically saved after you stop typing for half a second.</p>
                <h3>Archived applications</h3>
                <p>Archived notes are read-only. Unarchive the application before making further changes.</p>
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
                        <strong>Archived applications:</strong> View, filter, delete or unarchive applications.
                        Unarchiving also restores the linked interview, if one exists.
                    </li>
                    <li>
                        <strong>Archived interviews:</strong> These are read-only. Unarchive their related application
                        to restore them.
                    </li>
                </ul>
                <p>Archive mode keeps active views focused while preserving older records.</p>
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
                    Application, interview and archived-record viewers provide an <code>Export as CSV</code> action when
                    at least one record is available.
                </p>
                <h3>Sorting order</h3>
                <p>
                    Applications are grouped by status in this order: <code>Accepted</code>, <code>Offer</code>,{' '}
                    <code>Interview</code>, <code>Applied</code>, <code>Ghosted</code> and <code>Rejected</code>. Within
                    a status, the most recent application appears first.
                </p>
                <p>Interviews are ordered by interview date, with the earliest interview first.</p>
            </>
        ),
    },
    {
        id: 'highlighting',
        title: 'Highlighting and navigation feedback',
        icon: 'highlight',
        content: (
            <>
                <p>
                    After a status update, the application scrolls into view and receives a green highlight for four
                    seconds. No highlight is shown when the status did not change.
                </p>
                <p>The same feedback appears when navigating from an interview to its corresponding application.</p>
            </>
        ),
    },
];

const UserGuide = () => {
    const [activeSectionId, setActiveSectionId] = useState<string | null>(guideSections[0].id);

    return (
        <main data-testid='ug' className={styles.userGuide}>
            <div className={styles.guideContainer}>
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
