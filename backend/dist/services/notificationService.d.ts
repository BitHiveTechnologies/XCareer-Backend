export interface NotificationData {
    userId: string;
    type: 'job_alert' | 'subscription' | 'payment' | 'system' | 'profile' | 'application';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
}
declare class NotificationService {
    /**
     * Create a single notification
     */
    createNotification(data: NotificationData): Promise<any>;
    /**
     * Create multiple notifications
     */
    createBulkNotifications(notifications: NotificationData[]): Promise<any[]>;
    /**
     * Create job alert notification
     */
    createJobAlertNotification(userId: string, jobId: string, jobData?: any): Promise<any>;
    /**
     * Create subscription-related notification
     */
    createSubscriptionNotification(userId: string, type: 'activated' | 'expired' | 'cancelled' | 'payment_failed' | 'renewal_reminder', subscriptionData?: any): Promise<any>;
    /**
     * Create payment-related notification
     */
    createPaymentNotification(userId: string, type: 'success' | 'failed' | 'refunded', paymentData?: any): Promise<any>;
    /**
     * Create application status notification
     */
    createApplicationNotification(userId: string, applicationId: string, status: 'applied' | 'shortlisted' | 'rejected' | 'withdrawn', applicationData?: any): Promise<any>;
    /**
     * Create system notification
     */
    createSystemNotification(userId: string, title: string, message: string, priority?: 'low' | 'medium' | 'high' | 'urgent', category?: 'info' | 'success' | 'warning' | 'error', data?: Record<string, any>): Promise<any>;
    /**
     * Create profile completion notification
     */
    createProfileNotification(userId: string, type: 'incomplete' | 'complete' | 'update_required'): Promise<any>;
    /**
     * Clean up expired notifications
     */
    cleanupExpiredNotifications(): Promise<number>;
    /**
     * Get notification statistics for admin
     */
    getAdminStats(): Promise<any>;
}
export declare const notificationService: NotificationService;
export default notificationService;
//# sourceMappingURL=notificationService.d.ts.map