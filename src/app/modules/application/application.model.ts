import { Schema, model } from 'mongoose';
import {
  IApplicationDocument,
  IApplicationModel,
} from './application.interface';

const applicationSchema = new Schema<IApplicationDocument, IApplicationModel>(
  {
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [5, 'Serial number must be at least 5 characters'],
      maxlength: [30, 'Serial number must not exceed 30 characters'],
    },
    name: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      maxlength: [254, 'Email must not exceed 254 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      minlength: [6, 'Phone number must be at least 6 characters'],
      maxlength: [20, 'Phone number must not exceed 20 characters'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, 'Note must not exceed 1000 characters'],
    },
    passportNumber: {
      type: String,
      trim: true,
      maxlength: [30, 'Passport number must not exceed 30 characters'],
    },
    visaStatus: {
      type: String,
      trim: true,
      maxlength: [100, 'Visa status must not exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ status: 1 });

export const Application = model<IApplicationDocument, IApplicationModel>(
  'Application',
  applicationSchema,
);

