import mongoose, { Schema } from 'mongoose';
import { ISystemSettings } from './interfaces';

const systemSettingsSchema = new Schema<ISystemSettings>({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'email', 'payment', 'security', 'metrics'],
    default: 'general'
  }
}, {
  timestamps: true
});

export const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);
