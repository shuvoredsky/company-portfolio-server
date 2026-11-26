import { Schema, model } from 'mongoose';
import { INetwork } from './network.interface';

const networkSchema = new Schema<INetwork>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description must not exceed 5000 characters'],
    },
    image: {
      url: {
        type: String,
        required: [true, 'Image URL is required'],
      },
      publicId: {
        type: String,
        required: [true, 'Image publicId is required'],
      },
    },
    externalUrl: {
      type: String,
      trim: true,
      maxlength: [500, 'External URL must not exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  },
);

networkSchema.index({ createdAt: -1 });

export const Network = model<INetwork>('Network', networkSchema);

