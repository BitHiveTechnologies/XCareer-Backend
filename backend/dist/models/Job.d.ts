import mongoose, { Schema } from 'mongoose';
import { IJob } from './interfaces';
declare const jobSchema: mongoose.Schema<IJob, mongoose.Model<IJob, any, any, any, mongoose.Document<unknown, any, IJob, any, {}> & IJob & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IJob, mongoose.Document<unknown, {}, mongoose.FlatRecord<IJob>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IJob> & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const Job: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, {}> & IJob & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { jobSchema };
//# sourceMappingURL=Job.d.ts.map