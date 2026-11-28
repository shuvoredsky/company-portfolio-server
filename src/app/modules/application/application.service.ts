import status from 'http-status';
import AppError from '../../errors/AppError';
import { TMeta } from '../../utils/sendResponse';
import {
  IApplication,
  IApplicationListQuery,
  ICreateApplicationPayload,
  IPublicApplicationCheckResult,
  IUpdateApplicationPayload,
} from './application.interface';
import { Application } from './application.model';

const ADMIN_PROJECTION =
  'serialNumber name email phone note passportNumber visaStatus status createdAt updatedAt';
const PUBLIC_CHECK_PROJECTION = 'serialNumber status name note updatedAt -_id';

const DUPLICATE_SERIAL_MESSAGE = 'This serial number already exists';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isDuplicateKeyError = (error: unknown): boolean => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
};

export const maskApplicantName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word) => {
      const chars = Array.from(word);
      if (chars.length <= 2) {
        return `${chars[0] ?? ''}***`;
      }
      return `${chars.slice(0, 2).join('')}***`;
    })
    .join(' ');
};

const getAllApplicationsAdmin = async (
  query: IApplicationListQuery,
): Promise<{ data: unknown[]; meta: TMeta }> => {
  const { page, limit, status: statusFilter, search } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (statusFilter) {
    filter.status = statusFilter;
  }
  if (search && search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [
      { serialNumber: regex },
      { name: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .select(ADMIN_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getApplicationByIdAdmin = async (id: string) => {
  const application = await Application.findById(id)
    .select(ADMIN_PROJECTION)
    .lean();

  if (!application) {
    throw new AppError(status.NOT_FOUND, 'Application not found');
  }

  return application;
};

const createApplication = async (payload: ICreateApplicationPayload) => {
  const normalizedSerial = payload.serialNumber.trim().toUpperCase();

  const existing = await Application.exists({ serialNumber: normalizedSerial });
  if (existing) {
    throw new AppError(status.CONFLICT, DUPLICATE_SERIAL_MESSAGE);
  }

  const docData: IApplication = {
    serialNumber: normalizedSerial,
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone.trim(),
    status: payload.status ?? 'pending',
    ...(payload.note && payload.note.trim() !== ''
      ? { note: payload.note.trim() }
      : {}),
    ...(payload.passportNumber && payload.passportNumber.trim() !== ''
      ? { passportNumber: payload.passportNumber.trim() }
      : {}),
    ...(payload.visaStatus && payload.visaStatus.trim() !== ''
      ? { visaStatus: payload.visaStatus.trim() }
      : {}),
  };

  try {
    const created = await Application.create(docData);
    return created.toObject();
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(status.CONFLICT, DUPLICATE_SERIAL_MESSAGE);
    }
    throw error;
  }
};

const updateApplication = async (
  id: string,
  payload: IUpdateApplicationPayload,
) => {
  const existing = await Application.findById(id)
    .select(ADMIN_PROJECTION)
    .lean();

  if (!existing) {
    throw new AppError(status.NOT_FOUND, 'Application not found');
  }

  const setFields: Partial<IApplication> = {};
  const unsetFields: Record<string, 1> = {};

  if (payload.serialNumber !== undefined) {
    const normalizedSerial = payload.serialNumber.trim().toUpperCase();
    if (normalizedSerial !== existing.serialNumber) {
      const duplicate = await Application.exists({
        serialNumber: normalizedSerial,
        _id: { $ne: id },
      });
      if (duplicate) {
        throw new AppError(status.CONFLICT, DUPLICATE_SERIAL_MESSAGE);
      }
    }
    setFields.serialNumber = normalizedSerial;
  }

  if (payload.name !== undefined) {
    setFields.name = payload.name.trim();
  }
  if (payload.email !== undefined) {
    setFields.email = payload.email.trim().toLowerCase();
  }
  if (payload.phone !== undefined) {
    setFields.phone = payload.phone.trim();
  }
  if (payload.status !== undefined) {
    setFields.status = payload.status;
  }

  if (payload.note === '') {
    unsetFields.note = 1;
  } else if (payload.note !== undefined) {
    setFields.note = payload.note.trim();
  }

  if (payload.passportNumber === '') {
    unsetFields.passportNumber = 1;
  } else if (payload.passportNumber !== undefined) {
    setFields.passportNumber = payload.passportNumber.trim();
  }

  if (payload.visaStatus === '') {
    unsetFields.visaStatus = 1;
  } else if (payload.visaStatus !== undefined) {
    setFields.visaStatus = payload.visaStatus.trim();
  }

  const updateOp: Record<string, unknown> = {};
  if (Object.keys(setFields).length > 0) {
    updateOp.$set = setFields;
  }
  if (Object.keys(unsetFields).length > 0) {
    updateOp.$unset = unsetFields;
  }

  try {
    const updated = await Application.findByIdAndUpdate(id, updateOp, {
      new: true,
      runValidators: true,
    })
      .select(ADMIN_PROJECTION)
      .lean();

    if (!updated) {
      throw new AppError(status.NOT_FOUND, 'Application not found');
    }

    return updated;
  } catch (error: unknown) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(status.CONFLICT, DUPLICATE_SERIAL_MESSAGE);
    }
    throw error;
  }
};

const deleteApplication = async (id: string) => {
  const deleted = await Application.findByIdAndDelete(id)
    .select(ADMIN_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Application not found');
  }

  return deleted;
};

const checkApplicationStatusPublic = async (
  serialNumber: string,
): Promise<IPublicApplicationCheckResult> => {
  const normalizedSerial = serialNumber.trim().toUpperCase();

  const application = await Application.findOne({
    serialNumber: normalizedSerial,
  })
    .select(PUBLIC_CHECK_PROJECTION)
    .lean();

  if (!application) {
    throw new AppError(
      status.NOT_FOUND,
      'No application found for this serial number',
    );
  }

  return {
    serialNumber: application.serialNumber,
    status: application.status,
    maskedName: maskApplicantName(application.name),
    note: application.note ?? null,
    updatedAt: application.updatedAt ?? new Date(),
  };
};

export const ApplicationService = {
  getAllApplicationsAdmin,
  getApplicationByIdAdmin,
  createApplication,
  updateApplication,
  deleteApplication,
  checkApplicationStatusPublic,
};

