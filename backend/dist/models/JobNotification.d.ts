import mongoose, { Schema } from 'mongoose';
import { IJobNotification } from './interfaces';
declare const jobNotificationSchema: mongoose.Schema<IJobNotification, mongoose.Model<IJobNotification, any, any, any, mongoose.Document<unknown, any, IJobNotification, any, {}> & IJobNotification & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IJobNotification, mongoose.Document<unknown, {}, mongoose.FlatRecord<IJobNotification>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IJobNotification> & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const JobNotification: mongoose.Model<IJobNotification, {}, {}, {}, mongoose.Document<unknown, {}, IJobNotification, {}, {}> & IJobNotification & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { jobNotificationSchema };
//# sourceMappingURL=JobNotification.d.ts.map