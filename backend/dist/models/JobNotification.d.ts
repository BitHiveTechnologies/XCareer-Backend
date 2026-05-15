import mongoose from 'mongoose';
export interface IJobNotification extends mongoose.Document {
    jobId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    emailSent: boolean;
    emailSentAt?: Date | null;
    emailStatus: 'pending' | 'sent' | 'failed';
    matchScore: number;
    matchReasons: string[];
    isAutomatic: boolean;
    triggeredBy?: string;
    retryCount: number;
    lastRetryAt?: Date | null;
    deliveryStatus?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const jobNotificationSchema: mongoose.Schema<IJobNotification, mongoose.Model<IJobNotification, any, any, any, mongoose.Document<unknown, any, IJobNotification, any, {}> & IJobNotification & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IJobNotification, mongoose.Document<unknown, {}, mongoose.FlatRecord<IJobNotification>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IJobNotification> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export declare const JobNotification: mongoose.Model<IJobNotification, {}, {}, {}, mongoose.Document<unknown, {}, IJobNotification, {}, {}> & IJobNotification & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export { jobNotificationSchema };
//# sourceMappingURL=JobNotification.d.ts.map