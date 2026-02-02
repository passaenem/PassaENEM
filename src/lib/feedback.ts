export interface Feedback {
    id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    admin_response?: string;
    response_at?: string;
    // Joined data
    user?: {
        full_name?: string;
        email?: string;
    }
}
