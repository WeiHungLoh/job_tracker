import './UserGuide.css';

const UserGuide = () => {
    return (
        <div className="user-guide">
            <h1>📘 Job Tracker - User Guide</h1>

            <section>
                <h2>📝 Add Job Application</h2>
                <p>
                    Use this to log job opportunities. Enter the company name, title, status, and optional fields like application date, location and job URL. 
                </p>
                <p>
                    <strong>Note:</strong> If application date is left blank, current date will be added.
                </p>
                
            </section>

            <section>
                <h2>📄 View Job Applications</h2>
                <p>
                    Use this to see all active job applications. You can delete your job applications or update their statuses.
                </p>
                <p>
                    Clicking <strong>Edit Status</strong> will reveal a dropdown menu to change the job status. Updating the status to <strong>Interview</strong> will show a button: <strong>"Click here to add an interview"</strong>,
                    which takes you to a page where you can create an interview tied to that specific job application.
                </p>
                <p>
                    <strong>Note:</strong> If an interview already exists, you must delete it before changing the job status back to "Applied".
                </p>
                <p>
                    If you've added a job posting URL, make sure it's valid. The button that appears will use it to open the job posting page.
                </p>
                <p>
                    There's also a toggle to show or hide the archive button. You can archive a job application after revealing this button.
                </p>
            </section>

            <section>
                <h2>📅 View Interviews</h2>
                <p>
                    Displays interviews linked to your job applications. You can delete interviews here.
                </p>
                <p>
                    There's also a button labeled <strong>"Click here to view corresponding job application"</strong>, which takes you to the related job entry.
                </p>
            </section>

            <section>
                <h2>🗃️ Show Archive Mode</h2>
                <p>
                    Clicking <strong>Show Archive Mode</strong> will remove the usual navigation items — like <strong>Add Job Application</strong>, <strong>View Job Applications</strong>, and <strong>View Interviews</strong> — and replace them with two new sections:
                </p>
                <ul>
                    <li>
                        <strong>View Archived Applications</strong> – Shows job applications you've archived. You can view full details and choose to <strong>unarchive</strong> them, which will also restore their linked interviews (if any).
                    </li>
                    <li>
                        <strong>View Archived Interviews</strong> – Displays interviews linked to archived applications. These are view-only and cannot be directly unarchived. To unarchive them, you must unarchive the related job application.
                    </li>
                </ul>
                <p>
                    Archive mode helps you keep your dashboard clean while preserving old records. Use it to review past job applications and interviews.
                </p>
            </section>

            <section>
                <h2>⚠️ Deletion, Archiving & Unarchiving Rules</h2>
                <ul>
                    <li>
                        Deleting a job application — whether active or archived — will also delete its linked interview.
                    </li>
                    <li>
                        Only job applications can be archived. Archiving an application automatically archives its related interview.
                    </li>
                    <li>
                        Only job applications can be unarchived. Unarchiving an application will also unarchive its related interview.
                    </li>
                    <li>
                        Archived items are not editable. To make changes, either delete and re-create them, or unarchive them first.
                    </li>
                </ul>
            </section>

            <p className="tip">
                Tip: Prefer archiving over deleting if you want to keep records for later reference.
            </p>
        </div>
    );
};

export default UserGuide;
