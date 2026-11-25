import status from 'http-status';
import cloudinary, { isCloudinaryConfigured } from '../../config/cloudinary';
import AppError from '../errors/AppError';

export interface ICloudinaryImage {
  url: string;
  publicId: string;
}

export const uploadImage = async (
  buffer: Buffer,
  folder: string,
): Promise<ICloudinaryImage> => {
  if (!isCloudinaryConfigured()) {
    throw new AppError(
      status.SERVICE_UNAVAILABLE,
      'Image storage is not configured',
    );
  }

  return new Promise<ICloudinaryImage>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          {
            width: 1920,
            crop: 'limit',
            fetch_format: 'auto',
            quality: 'auto',
          },
        ],
      },
      (error, result) => {
        if (error || !result?.secure_url || !result?.public_id) {
          console.error('[ERROR] Cloudinary upload failed:', error);
          reject(
            new AppError(
              status.INTERNAL_SERVER_ERROR,
              'Failed to upload image',
            ),
          );
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) {
    return;
  }

  if (!isCloudinaryConfigured()) {
    console.warn(
      `[WARN] Cloudinary is not configured. Skipping deletion for publicId "${publicId}".`,
    );
    return;
  }

  try {
    const result = (await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })) as { result?: string };

    if (result.result !== 'ok' && result.result !== 'not found') {
      console.warn(
        `[WARN] Unexpected Cloudinary delete result for "${publicId}":`,
        result,
      );
    }
  } catch (error: unknown) {
    console.error(
      `[ERROR] Failed to delete image "${publicId}" from Cloudinary:`,
      error,
    );
  }
};

