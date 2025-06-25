import './UserGuide.css'

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
                    Clicking <code>Edit Status</code> will reveal a dropdown menu to change the job status. Updating the status to <code>Interview</code> will show a button: <code>Click here to add an interview</code>,
                    which takes you to a page where you can create an interview tied to that specific job application.
                </p>
                <p>
                    <strong>Note:</strong> If an interview already exists, you must delete it before changing the job status back to <code>Applied</code>.
                </p>
                <p>
                    If you've added a job posting URL, make sure it's valid. The button that appears will use it to open the job posting page.
                </p>
                <p>
                    There's also a toggle to unhide/hide the archive button. You can archive a job application after revealing this button.
                </p>
            </section>

            <section>
                <h2>📅 View Interviews</h2>
                <p>
                    Displays interviews linked to your job applications. You can delete interviews here.
                </p>
                <p>
                    There's also a button labeled <code>Click here to view corresponding job application</code>, which takes you to the related job entry.
                </p>
            </section>

            <section>
                <h2>🗃️ Show Archive Mode</h2>
                <p>
                    Clicking <code>Show Archived</code> will remove the usual navigation items — like <strong>Add Job Application</strong>, <strong>View Job Applications</strong>, and <strong>View Interviews</strong> — and replace them with two new sections:
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
                    Archive mode helps you keep your dashboard clean while preserving old records. Use it to review past job applications and interviews. To go back to active mode click <code>Show Active</code> on the navigation bar.
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

            <section>
                <h2>⚡ Deleting Job Applications and Job Interviews (active or archived)</h2>
                <p>When you delete a job application or a job interview, a confirmation dialog will appear:</p>
                <ul>
                    <li><strong>Single Delete</strong> – A popup will ask, "Are you sure you want to delete this item? This action is <strong>permanent</strong> and <strong>cannot be undone</strong>."
                        You can click <code>Delete</code> or press Enter to confirm, or click <code>Cancel</code> or press <kbd>Esc</kbd> to cancel.

                    </li>
                    <li><strong>Delete All</strong> – A similar popup will ask, "Are you sure you want to delete all items? This action is permanent and <em>cannot be undone</em>."
                        You <strong>MUST</strong> click <code>Delete all</code> to confirm, or click <code>Cancel</code> or press <kbd>Esc</kbd> to cancel.
                    </li>
                </ul>
                <p>Always review before confirming deletions to prevent loss of important data.</p>
            </section>

            <section>
                <h2>🔀 Sorting Order</h2>
                <p>
                    Job applications and archived job applications are sorted first by <strong>job status</strong> in this order: <br />
                    <code>Accepted</code>, <code>Offer</code>, <code>Interview</code>, <code>Applied</code>, <code>Ghosted</code>, <code>Rejected</code>.
                </p>
                <p>
                    Within each status, applications are sorted by <strong>application date</strong> in descending order (most recent first).
                </p>
                <p>
                    Job interviews and archived job interviews are sorted by <strong>interview date</strong> in ascending order (earliest first).
                </p>
            </section>

            <section>
                <h2>✨ Highlight Animation</h2>
                <p>
                    When you edit the status of a job application, the page will automatically scroll to that specific application and highlight it with a green background for 4 seconds to help you easily spot the update.
                </p>
                <p>
                    Similarly, when you click the button labeled <code>Click here to view corresponding job application</code> in the Interviews section, it will scroll to and highlight the related job application in green for 4 seconds to make navigation clearer.
                </p>
            </section>
            <p className="tip">
                Tip: Prefer archiving over deleting if you want to keep records for later reference.
            </p>
        </div>
    )
}

export default UserGuide
