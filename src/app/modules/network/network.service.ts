import status from 'http-status';
import AppError from '../../errors/AppError';
import { deleteImage, uploadImage } from '../../utils/cloudinary';
import { TMeta } from '../../utils/sendResponse';
import {
  ICreateNetworkPayload,
  INetwork,
  INetworkListQuery,
  IUpdateNetworkPayload,
} from './network.interface';
import { Network } from './network.model';

const NETWORK_FOLDER = 'company-portfolio/networks';
const NETWORK_PROJECTION =
  'title description image externalUrl createdAt updatedAt';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAllNetworks = async (
  query: INetworkListQuery,
): Promise<{ data: unknown[]; meta: TMeta }> => {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (search && search.trim()) {
    filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
  }

  const [networks, total] = await Promise.all([
    Network.find(filter)
      .select(NETWORK_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Network.countDocuments(filter),
  ]);

  return {
    data: networks,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getNetworkById = async (id: string) => {
  const network = await Network.findById(id).select(NETWORK_PROJECTION).lean();

  if (!network) {
    throw new AppError(status.NOT_FOUND, 'Network item not found');
  }

  return network;
};

const createNetwork = async (
  payload: ICreateNetworkPayload,
  file?: Express.Multer.File,
) => {
  if (!file) {
    throw new AppError(status.BAD_REQUEST, 'Network image is required');
  }

  const uploadedImage = await uploadImage(file.buffer, NETWORK_FOLDER);

  const docData: INetwork = {
    title: payload.title,
    description: payload.description,
    image: uploadedImage,
    ...(payload.externalUrl ? { externalUrl: payload.externalUrl } : {}),
  };

  try {
    const created = await Network.create(docData);
    return created.toObject();
  } catch (error: unknown) {
    await deleteImage(uploadedImage.publicId);
    throw error;
  }
};

const updateNetwork = async (
  id: string,
  payload: IUpdateNetworkPayload,
  file?: Express.Multer.File,
) => {
  const existing = await Network.findById(id)
    .select(NETWORK_PROJECTION)
    .lean();

  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Network item not found');
  }

  const setFields: Partial<INetwork> = {};
  const unsetFields: Record<string, 1> = {};

  if (payload.title !== undefined) {
    setFields.title = payload.title;
  }
  if (payload.description !== undefined) {
    setFields.description = payload.description;
  }
  if (payload.externalUrl === '') {
    unsetFields.externalUrl = 1;
  } else if (payload.externalUrl !== undefined) {
    setFields.externalUrl = payload.externalUrl;
  }

  let newUploadedPublicId: string | undefined;

  if (file) {
    const uploadedImage = await uploadImage(file.buffer, NETWORK_FOLDER);
    newUploadedPublicId = uploadedImage.publicId;
    setFields.image = uploadedImage;
  }

  const updateOp: Record<string, unknown> = {};
  if (Object.keys(setFields).length > 0) {
    updateOp.$set = setFields;
  }
  if (Object.keys(unsetFields).length > 0) {
    updateOp.$unset = unsetFields;
  }

  try {
    const updated = await Network.findByIdAndUpdate(id, updateOp, {
      new: true,
      runValidators: true,
    })
      .select(NETWORK_PROJECTION)
      .lean();

    if (!updated) {
      if (newUploadedPublicId) {
        await deleteImage(newUploadedPublicId);
      }
      throw new AppError(status.NOT_FOUND, 'Network item not found');
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

const deleteNetwork = async (id: string) => {
  const deleted = await Network.findByIdAndDelete(id)
    .select(NETWORK_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Network item not found');
  }

  await deleteImage(deleted.image.publicId);
  return deleted;
};

export const NetworkService = {
  getAllNetworks,
  getNetworkById,
  createNetwork,
  updateNetwork,
  deleteNetwork,
};

