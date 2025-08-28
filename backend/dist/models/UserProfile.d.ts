import mongoose, { Schema } from 'mongoose';
import { IUserProfile } from './interfaces';
declare const userProfileSchema: mongoose.Schema<IUserProfile, mongoose.Model<IUserProfile, any, any, any, mongoose.Document<unknown, any, IUserProfile, any, {}> & IUserProfile & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IUserProfile, mongoose.Document<unknown, {}, mongoose.FlatRecord<IUserProfile>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<IUserProfile> & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const UserProfile: mongoose.Model<IUserProfile, {}, {}, {}, mongoose.Document<unknown, {}, IUserProfile, {}, {}> & IUserProfile & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { userProfileSchema };
//# sourceMappingURL=UserProfile.d.ts.map