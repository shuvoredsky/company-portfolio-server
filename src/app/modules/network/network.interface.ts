import { ICloudinaryImage } from '../../utils/cloudinary';

export interface INetwork {
  title: string;
  description: string;
  image: ICloudinaryImage;
  externalUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateNetworkPayload {
  title: string;
  description: string;
  externalUrl?: string;
}

export interface IUpdateNetworkPayload {
  title?: string;
  description?: string;
  externalUrl?: string;
}

export interface INetworkListQuery {
  page: number;
  limit: number;
  search?: string;
}

