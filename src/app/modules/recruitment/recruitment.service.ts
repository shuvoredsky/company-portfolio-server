import status from 'http-status';
import AppError from '../../errors/AppError';
import { TMeta } from '../../utils/sendResponse';
import {
  ICreateRecruitmentPayload,
  IRecruitmentListQuery,
  IUpdateRecruitmentPayload,
} from './recruitment.interface';
import { Recruitment } from './recruitment.model';

const RECRUITMENT_PROJECTION =
  'title description isActive createdAt updatedAt';

const listRecruitments = async (
  filter: Record<string, unknown>,
  query: IRecruitmentListQuery,
): Promise<{ data: unknown[]; meta: TMeta }> => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Recruitment.find(filter)
      .select(RECRUITMENT_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Recruitment.countDocuments(filter),
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

const getActiveRecruitments = async (query: IRecruitmentListQuery) => {
  return listRecruitments({ isActive: true }, query);
};

const getAllRecruitmentsAdmin = async (query: IRecruitmentListQuery) => {
  return listRecruitments({}, query);
};

const getRecruitmentById = async (id: string) => {
  const recruitment = await Recruitment.findById(id)
    .select(RECRUITMENT_PROJECTION)
    .lean();

  if (!recruitment) {
    throw new AppError(status.NOT_FOUND, 'Recruitment post not found');
  }

  return recruitment;
};

const createRecruitment = async (payload: ICreateRecruitmentPayload) => {
  const created = await Recruitment.create(payload);
  return created.toObject();
};

const updateRecruitment = async (
  id: string,
  payload: IUpdateRecruitmentPayload,
) => {
  const updated = await Recruitment.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })
    .select(RECRUITMENT_PROJECTION)
    .lean();

  if (!updated) {
    throw new AppError(status.NOT_FOUND, 'Recruitment post not found');
  }

  return updated;
};

const deleteRecruitment = async (id: string) => {
  const deleted = await Recruitment.findByIdAndDelete(id)
    .select(RECRUITMENT_PROJECTION)
    .lean();

  if (!deleted) {
    throw new AppError(status.NOT_FOUND, 'Recruitment post not found');
  }

  return deleted;
};

export const RecruitmentService = {
  getActiveRecruitments,
  getAllRecruitmentsAdmin,
  getRecruitmentById,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
};

