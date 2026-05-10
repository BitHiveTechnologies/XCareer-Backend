import { UserContext } from '../../services/rbacService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: 'user' | 'admin' | 'super_admin';
        type: 'user' | 'admin';
        clerkUserId?: string;
        metadata?: any;
      };
      userContext?: UserContext;
      rawBody?: string;
    }
  }
}

export {};
