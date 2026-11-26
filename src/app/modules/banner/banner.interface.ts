import { ICloudinaryImage } from '../../utils/cloudinary';

export interface IBanner {
  image: ICloudinaryImage;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateBannerPayload {
  order?: number;
  isActive?: boolean;
}

export interface IUpdateBannerPayload {
  order?: number;
  isActive?: boolean;
}
