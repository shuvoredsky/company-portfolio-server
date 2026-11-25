import status from 'http-status';
import AppError from '../../errors/AppError';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import {
  IBanner,
  ICreateBannerPayload,
  IUpdateBannerPayload,
} from './banner.interface';
import { Banner } from './banner.model';

const BANNER_FOLDER = 'company-portfolio/banners';
const BANNER_PROJECTION =
  'title subtitle image ctaText ctaLink order isActive createdAt updatedAt';

const getActiveBanners = async () => {
  return Banner.find({ isActive: true })
    .select(BANNER_PROJECTION)
    .sort({ order: 1, createdAt: -1 })
    .lean();
};

const getAllBannersAdmin = async () => {
  return Banner.find()
    .select(BANNER_PROJECTION)
    .sort({ order: 1, createdAt: -1 })
    .lean();
};

const createBanner = async (
  payload: ICreateBannerPayload,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(status.BAD_REQUEST, 'Banner image is required');
  }

  const uploadedImage = await uploadImage(file.buffer, BANNER_FOLDER);

  try {
    const created = await Banner.create({
      ...payload,
      image: uploadedImage,
    });
    return created.toObject();
  } catch (error: unknown) {
    await deleteImage(uploadedImage.publicId);
    throw error;
  }
};

const updateBanner = async (
  id: string,
  payload: IUpdateBannerPayload,
  file?: Express.Multer.File,
) => {
  const existing = await Banner.findById(id).select(BANNER_PROJECTION).lean();

  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Banner not found');
  }

  const updateData: Partial<IBanner> = { ...payload };
  let newUploadedPublicId: string | undefined;

  if (file) {
    const uploadedImage = await uploadImage(file.buffer, BANNER_FOLDER);
    newUploadedPublicId = uploadedImage.publicId;
    updateData.image = uploadedImage;
  }

  try {
    const updated = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select(BANNER_PROJECTION)
      .lean();

    if (!updated) {
      if (newUploadedPublicId) {
        await deleteImage(newUploadedPublicId);
      }
      throw new AppError(status.NOT_FOUND, 'Banner not found');
    }

    if (newUploadedPublicId && existing.image.publicId) {
      await deleteImage(existing.image.publicId);
    }

    return updated;
  } catch (error: unknown) {
    if (newUploadedPublicId) {
      await deleteImage(newUploadedPublicId);
    }
    throw error;
  }
};

const deleteBanner = async (id: string) => {
  const deleted = await Banner.findByIdAndDelete(id)
    .select(BANNER_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Banner not found');
  }

  await deleteImage(deleted.image.publicId);
  return deleted;
};

export const BannerService = {
  getActiveBanners,
  getAllBannersAdmin,
  createBanner,
  updateBanner,
  deleteBanner,
};

