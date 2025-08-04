import './UserGuide.css'

const UserGuide = () => {
    return (
        <div data-testid='ug' className="user-guide">
            <h1>📘 Job Tracker - User Guide</h1>

            <section>
                <h2>📊 Dashboard</h2>
                <p>
                    The dashboard gives you a quick visual overview of your job search progress:
                </p>
                <ul>
                    <li>
                        📈 <strong>Line Chart</strong> – Shows the number of job applications added over the past 8 weeks, grouped by week. The x-axis labels indicate the <strong>first day of the week (Monday)</strong> for each week shown. Use this to track your application trends and consistency.
                    </li>
                    <li>
                        🥧 <strong>Pie Chart</strong> – Displays the distribution of all your job applications by status (e.g., Applied, Interview, Offer, Rejected, etc). This helps you understand your current job pipeline at a glance.
                    </li>
                </ul>
                <p>
                    You can access the dashboard by selecting <code>Dashboard</code> from the navigation bar.
                </p>
            </section>

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
                <p>
                    You can now filter job applications using the <strong>Filter by</strong> dropdown beside Job Application Viewer header. Select a status like <code>Applied</code> or <code>Interview</code>, etc to view only applications with that status. Choose <code>Show All</code> to show everything.
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
                <h2>📝 Notes Visibility Toggle</h2>
                <p>
                    At the top of both application viewer pages, you’ll find a toggle button labeled <code>Unhide Notes</code> or <code>Hide Notes</code>. Clicking this button will
                    unhide or hide all notes for all job applications listed.
                </p>

                <h3>✏️ Editable Notes (View Job Applications)</h3>
                <p>
                    On the <strong>View Job Applications</strong> page, notes are <strong>editable</strong>.
                    You can type directly into the note fields, and your changes are automatically saved
                    after 0.5 seconds of not typing anything.
                </p>

                <h3>🔒 Read-Only Notes (View Archived Applications)</h3>
                <p>
                    On the <strong>View Archived Applications</strong> page, notes are <strong>read-only</strong>.
                    While you can still toggle their visibility using the same button, you cannot edit them once the application is archived.
                </p>
            </section>

            <section>
                <h2>🗃️ Show Archive Mode</h2>
                <p>
                    Clicking <code>Show Archived</code> will remove the usual navigation items - like <strong>Dashboard</strong>, <strong>Add Job Application</strong>, <strong>View Job Applications</strong>, and <strong>View Interviews</strong> - and replace them with two new sections:
                </p>
                <ul>
                    <li>
                        <strong>View Archived Applications</strong> – Shows job applications you've archived. You can view full details and choose to <strong>unarchive</strong> them, which will also restore their linked interviews (if any).
                        You can now filter archived job applications using the <strong>Filter by</strong> dropdown beside Archived Job Application header. Select a status like <code>Applied</code> or <code>Interview</code> to view only applications with that status. Choose <code>Show All</code> to show everything.
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
                        Deleting a job application - whether active or archived - will also delete its linked interview.
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
                        The Delete All button will only appear when there is at least one entry available to delete.
                    </li>
                </ul>
                <p>Always review before confirming deletions to prevent loss of important data.</p>
            </section>

            <section>
                <h2>📤 Export as CSV</h2>
                <p>
                    You can export job applications, interviews, and archived records as CSV files using the <code>Export as CSV</code> button available in each relevant view.
                    This button will appear only when there is at least one entry to export.
                </p>
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
