import { ICloudinaryImage } from '../../utils/cloudinary';

export interface IBlog {
  title: string;
  description: string;
  image: ICloudinaryImage;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateBlogPayload {
  title: string;
  description: string;
}

export interface IUpdateBlogPayload {
  title?: string;
  description?: string;
}

export interface IBlogListQuery {
  page: number;
  limit: number;
  search?: string;
}

