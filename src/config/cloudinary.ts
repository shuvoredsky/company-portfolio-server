import { v2 as cloudinary } from 'cloudinary';
import config from './index';

export const isCloudinaryConfigured = (): boolean => {
  return Boolean(
    config.cloudinary.cloudName.trim() &&
      config.cloudinary.apiKey.trim() &&
      config.cloudinary.apiSecret.trim(),
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

export default cloudinary;

