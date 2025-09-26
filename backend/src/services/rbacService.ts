import { logger } from '../utils/logger';

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

// Define available roles and their permissions
export const ROLES: Record<string, Role> = {
  super_admin: {
    name: 'super_admin',
    permissions: [
      { resource: '*', action: '*' }, // Full access to everything
    ],
  },
  admin: {
    name: 'admin',
    permissions: [
      { resource: 'users', action: '*' },
      { resource: 'subscriptions', action: '*' },
      { resource: 'payments', action: '*' },
      { resource: 'analytics', action: '*' },
      { resource: 'jobs', action: '*' },
      { resource: 'notifications', action: '*' },
      { resource: 'templates', action: '*' },
      { resource: 'provisioning', action: '*' },
    ],
  },
  user: {
    name: 'user',
    permissions: [
      { resource: 'profile', action: '*' },
      { resource: 'subscriptions', action: ['read', 'update'] },
      { resource: 'jobs', action: ['read', 'apply'] },
      { resource: 'notifications', action: ['read', 'update'] },
    ],
  },
};

// Define subscription-based permissions
export const SUBSCRIPTION_PERMISSIONS: Record<string, Permission[]> = {
  basic: [
    { resource: 'jobs', action: 'read', conditions: { limit: 10 } },
    { resource: 'profile', action: '*' },
    { resource: 'notifications', action: ['read', 'update'] },
  ],
  premium: [
    { resource: 'jobs', action: 'read', conditions: { limit: 50 } },
    { resource: 'jobs', action: 'apply' },
    { resource: 'profile', action: '*' },
    { resource: 'notifications', action: '*' },
    { resource: 'analytics', action: 'read', conditions: { scope: 'personal' } },
    { resource: 'templates', action: 'read' },
  ],
  enterprise: [
    { resource: 'jobs', action: '*' },
    { resource: 'profile', action: '*' },
    { resource: 'notifications', action: '*' },
    { resource: 'analytics', action: '*' },
    { resource: 'templates', action: '*' },
    { resource: 'priority_support', action: '*' },
  ],
};

export class RBACService {
  /**
   * Check if user has permission to perform action on resource
   */
  static hasPermission(
    user: UserContext,
    resource: string,
    action: string,
    conditions?: Record<string, any>
  ): boolean {
    try {
      // Super admin has all permissions
      if (user.role === 'super_admin') {
        return true;
      }

      // Get user's role permissions
      const rolePermissions = ROLES[user.role]?.permissions || [];
      
      // Get subscription-based permissions
      const subscriptionPermissions = user.subscriptionPlan 
        ? SUBSCRIPTION_PERMISSIONS[user.subscriptionPlan] || []
        : [];

      // Check role-based permissions
      const hasRolePermission = this.checkPermissions(rolePermissions, resource, action, conditions);
      
      // Check subscription-based permissions
      const hasSubscriptionPermission = this.checkPermissions(subscriptionPermissions, resource, action, conditions);

      // User needs either role permission OR subscription permission
      const hasPermission = hasRolePermission || hasSubscriptionPermission;

      logger.debug('Permission check', {
        userId: user.id,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        resource,
        action,
        hasRolePermission,
        hasSubscriptionPermission,
        hasPermission,
      });

      return hasPermission;
    } catch (error) {
      logger.error('Permission check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: user.id,
        resource,
        action,
      });
      return false;
    }
  }

  /**
   * Check permissions against a list
   */
  private static checkPermissions(
    permissions: Permission[],
    resource: string,
    action: string,
    conditions?: Record<string, any>
  ): boolean {
    return permissions.some(permission => {
      // Check wildcard permissions
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }
      if (permission.resource === '*' && permission.action === action) {
        return true;
      }
      if (permission.resource === resource && permission.action === '*') {
        return true;
      }

      // Check exact match
      if (permission.resource === resource && permission.action === action) {
        return true;
      }

      // Check array of actions
      if (permission.resource === resource && Array.isArray(permission.action)) {
        return permission.action.includes(action);
      }

      return false;
    });
  }

  /**
   * Get user's effective permissions
   */
  static getUserPermissions(user: UserContext): Permission[] {
    const rolePermissions = ROLES[user.role]?.permissions || [];
    const subscriptionPermissions = user.subscriptionPlan 
      ? SUBSCRIPTION_PERMISSIONS[user.subscriptionPlan] || []
      : [];

    // Combine and deduplicate permissions
    const allPermissions = [...rolePermissions, ...subscriptionPermissions];
    const uniquePermissions = allPermissions.filter((permission, index, self) => 
      index === self.findIndex(p => 
        p.resource === permission.resource && 
        p.action === permission.action
      )
    );

    return uniquePermissions;
  }

  /**
   * Check if user can access admin features
   */
  static isAdmin(user: UserContext): boolean {
    return user.role === 'admin' || user.role === 'super_admin';
  }

  /**
   * Check if user has active subscription
   */
  static hasActiveSubscription(user: UserContext): boolean {
    return user.subscriptionStatus === 'active' || user.subscriptionStatus === 'completed';
  }

  /**
   * Check if user can access premium features
   */
  static canAccessPremiumFeatures(user: UserContext): boolean {
    return this.hasActiveSubscription(user) && 
           (user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'enterprise');
  }

  /**
   * Check if user can access enterprise features
   */
  static canAccessEnterpriseFeatures(user: UserContext): boolean {
    return this.hasActiveSubscription(user) && user.subscriptionPlan === 'enterprise';
  }

  /**
   * Get subscription-based limits
   */
  static getSubscriptionLimits(user: UserContext): Record<string, number> {
    const limits: Record<string, number> = {};

    if (user.subscriptionPlan === 'basic') {
      limits.jobApplications = 10;
      limits.jobSearches = 5;
      limits.profileViews = 3;
    } else if (user.subscriptionPlan === 'premium') {
      limits.jobApplications = 50;
      limits.jobSearches = 20;
      limits.profileViews = 10;
    } else if (user.subscriptionPlan === 'enterprise') {
      limits.jobApplications = -1; // Unlimited
      limits.jobSearches = -1; // Unlimited
      limits.profileViews = -1; // Unlimited
    }

    return limits;
  }

  /**
   * Validate user access to specific resource
   */
  static validateAccess(
    user: UserContext,
    resource: string,
    action: string,
    conditions?: Record<string, any>
  ): { allowed: boolean; reason?: string } {
    // Check if user is active
    if (user.isActive === false) {
      return { allowed: false, reason: 'User account is inactive' };
    }

    // Check subscription status for subscription-dependent resources
    const subscriptionDependentResources = ['jobs', 'analytics', 'templates', 'priority_support'];
    if (subscriptionDependentResources.includes(resource) && !this.hasActiveSubscription(user)) {
      return { allowed: false, reason: 'Active subscription required' };
    }

    // Check specific permissions
    if (!this.hasPermission(user, resource, action, conditions)) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }

    return { allowed: true };
  }
}

export default RBACService;
