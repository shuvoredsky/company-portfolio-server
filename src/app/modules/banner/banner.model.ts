import { Schema, model } from 'mongoose';
import { IBanner } from './banner.interface';

const bannerSchema = new Schema<IBanner>(
  {
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
    order: {
      type: Number,
      default: 0,
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

bannerSchema.index({ isActive: 1, order: 1 });

export const Banner = model<IBanner>('Banner', bannerSchema);
