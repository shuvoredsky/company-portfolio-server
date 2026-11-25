import { Schema, model } from 'mongoose';
import { IRecruitment } from './recruitment.interface';

const recruitmentSchema = new Schema<IRecruitment>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

recruitmentSchema.index({ isActive: 1, createdAt: -1 });

export const Recruitment = model<IRecruitment>(
  'Recruitment',
  recruitmentSchema,
);

