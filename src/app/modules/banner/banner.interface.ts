import { ICloudinaryImage } from '../../utils/cloudinary';

export interface IBanner {
  title: string;
  subtitle?: string;
  image: ICloudinaryImage;
  ctaText?: string;
  ctaLink?: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateBannerPayload {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
  isActive?: boolean;
}

export interface IUpdateBannerPayload {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order?: number;
  isActive?: boolean;
}

