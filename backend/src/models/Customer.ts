import mongoose, { Schema } from 'mongoose';
import { ICustomer } from './interfaces';

const customerSchema = new Schema<ICustomer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  mobile: {
    type: String,
    required: true
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  subscriptionCount: {
    type: Number,
    default: 0
  },
  lastSubscriptionDate: {
    type: Date,
    default: Date.now
  },
  cashfreeCustomerId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  }
}, {
  timestamps: true
});

// Indexes for performance
customerSchema.index({ email: 1 });
customerSchema.index({ userId: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ lastSubscriptionDate: -1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
