import mongoose, { Schema } from 'mongoose';
import { IAdmin } from './interfaces';
declare const adminSchema: mongoose.Schema<IAdmin, mongoose.Model<IAdmin, any, any, any, mongoose.Document<unknown, any, IAdmin, any, {}> & IAdmin & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IAdmin, mongoose.Document<unknown, {}, mongoose.FlatRecord<IAdmin>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IAdmin> & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const Admin: mongoose.Model<IAdmin, {}, {}, {}, mongoose.Document<unknown, {}, IAdmin, {}, {}> & IAdmin & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { adminSchema };
//# sourceMappingURL=Admin.d.ts.map