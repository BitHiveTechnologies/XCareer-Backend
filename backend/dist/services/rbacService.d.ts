/**
 * Role-Based Access Control (RBAC) Service
 * Manages permissions and access control based on user roles and subscription tiers
 */
export interface Permission {
    resource: string;
    action: string | string[];
    conditions?: Record<string, any>;
}
export interface Role {
    name: string;
    permissions: Permission[];
    inherits?: string[];
}
export interface UserContext {
    id: string;
    role: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    isActive?: boolean;
}
export declare const ROLES: Record<string, Role>;
export declare const SUBSCRIPTION_PERMISSIONS: Record<string, Permission[]>;
export declare class RBACService {
    /**
     * Check if user has permission to perform action on resource
     */
    static hasPermission(user: UserContext, resource: string, action: string, conditions?: Record<string, any>): boolean;
    /**
     * Check permissions against a list
     */
    private static checkPermissions;
    /**
     * Get user's effective permissions
     */
    static getUserPermissions(user: UserContext): Permission[];
    /**
     * Check if user can access admin features
     */
    static isAdmin(user: UserContext): boolean;
    /**
     * Check if user has active subscription
     */
    static hasActiveSubscription(user: UserContext): boolean;
    /**
     * Check if user can access premium features
     */
    static canAccessPremiumFeatures(user: UserContext): boolean;
    /**
     * Check if user can access enterprise features
     */
    static canAccessEnterpriseFeatures(user: UserContext): boolean;
    /**
     * Get subscription-based limits
     */
    static getSubscriptionLimits(user: UserContext): Record<string, number>;
    /**
     * Validate user access to specific resource
     */
    static validateAccess(user: UserContext, resource: string, action: string, conditions?: Record<string, any>): {
        allowed: boolean;
        reason?: string;
    };
}
export default RBACService;
//# sourceMappingURL=rbacService.d.ts.map