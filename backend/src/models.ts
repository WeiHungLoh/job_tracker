interface User {
    user_id: number
    email: string
    hashed_password: string
    created_at: string
}

interface Application {
    job_id: number
    user_id: number
    company_name: string
    job_title: string
    application_date: string
    job_status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Accepted'
    location?: string | null
    job_posting_url?: string | null
}

interface Interview {
    interview_id: number
    job_id: number
    interview_date: string
    location: string
    interview_type?: string | null
    notes?: string | null
    created_at: string
}

export { User, Application, Interview }
