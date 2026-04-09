import mongoose from 'mongoose';
export interface INotification extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    type: 'job_alert' | 'subscription' | 'payment' | 'system' | 'profile' | 'application';
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    actionText?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
declare const Notification: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Notification;
//# sourceMappingURL=Notification.d.ts.map