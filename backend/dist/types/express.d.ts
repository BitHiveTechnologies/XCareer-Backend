import { Request } from 'express';
export interface CustomRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: any;
    };
}
export interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: Record<string, any>;
    };
}
export interface AdminRequest extends Request {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'admin' | 'super_admin';
        type: 'admin';
        clerkUserId?: string;
        metadata?: Record<string, any>;
    };
}
export interface AuthRequest extends Request {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: any;
    };
}
export interface ClerkAuthRequest extends Request {
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId: string;
        metadata?: Record<string, any>;
    };
}
//# sourceMappingURL=express.d.ts.map