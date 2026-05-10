import mongoose, { Schema } from 'mongoose';
import { IResume } from './interfaces';
export declare const Resume: mongoose.Model<IResume, {}, {}, {}, mongoose.Document<unknown, {}, IResume, {}, {}> & IResume & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Resume.d.ts.map