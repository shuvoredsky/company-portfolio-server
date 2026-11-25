import status from 'http-status';
import AppError from '../../errors/AppError';
import { TMeta } from '../../utils/sendResponse';
import {
  IContactListQuery,
  ICreateContactPayload,
} from './contact.interface';
import { Contact } from './contact.model';

const CONTACT_PROJECTION =
  'name country phone email message isRead createdAt updatedAt';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createContact = async (payload: ICreateContactPayload) => {
  // Honeypot bot trap: silently accept without saving
  if (payload.website && payload.website.trim().length > 0) {
    return null;
  }

  const created = await Contact.create({
    name: payload.name,
    country: payload.country,
    phone: payload.phone,
    email: payload.email,
    message: payload.message,
    isRead: false,
  });

  return {
    _id: created._id.toString(),
    name: created.name,
    country: created.country,
    createdAt: created.createdAt,
  };
};

const getAllContacts = async (
  query: IContactListQuery,
): Promise<{ data: unknown[]; meta: TMeta }> => {
  const { page, limit, isRead, search } = query;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (typeof isRead === 'boolean') {
    filter.isRead = isRead;
  }

  if (search && search.trim()) {
    const regex = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .select(CONTACT_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Contact.countDocuments(filter),
  ]);

  return {
    data: contacts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getContactById = async (id: string) => {
  const contact = await Contact.findById(id).select(CONTACT_PROJECTION).lean();

  if (!contact) {
    throw new AppError(status.NOT_FOUND, 'Contact submission not found');
  }

  return contact;
};

const updateContactReadStatus = async (id: string, isRead: boolean) => {
  const updated = await Contact.findByIdAndUpdate(
    id,
    { isRead },
    { new: true, runValidators: true },
  )
    .select(CONTACT_PROJECTION)
    .lean();

  if (!updated) {
    throw new AppError(status.NOT_FOUND, 'Contact submission not found');
  }

  return updated;
};

const deleteContact = async (id: string) => {
  const deleted = await Contact.findByIdAndDelete(id)
    .select(CONTACT_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Contact submission not found');
  }

  return deleted;
};

export const ContactService = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactReadStatus,
  deleteContact,
};
