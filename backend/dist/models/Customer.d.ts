import mongoose, { Schema } from 'mongoose';
import { ICustomer } from './interfaces';
export declare const Customer: mongoose.Model<ICustomer, {}, {}, {}, mongoose.Document<unknown, {}, ICustomer, {}, {}> & ICustomer & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Customer.d.ts.map