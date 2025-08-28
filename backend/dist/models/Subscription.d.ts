import mongoose, { Schema } from 'mongoose';
import { ISubscription } from './interfaces';
declare const subscriptionSchema: mongoose.Schema<ISubscription, mongoose.Model<ISubscription, any, any, any, mongoose.Document<unknown, any, ISubscription, any, {}> & ISubscription & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ISubscription, mongoose.Document<unknown, {}, mongoose.FlatRecord<ISubscription>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<ISubscription> & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const Subscription: mongoose.Model<ISubscription, {}, {}, {}, mongoose.Document<unknown, {}, ISubscription, {}, {}> & ISubscription & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export { subscriptionSchema };
//# sourceMappingURL=Subscription.d.ts.map