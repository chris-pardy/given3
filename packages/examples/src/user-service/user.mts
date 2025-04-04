export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    state?: string;
    zip?: string;
    roles: string[];
}