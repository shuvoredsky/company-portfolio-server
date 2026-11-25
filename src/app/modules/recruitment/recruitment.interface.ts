export interface IRecruitment {
  title: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateRecruitmentPayload {
  title: string;
  description: string;
  isActive?: boolean;
}

export interface IUpdateRecruitmentPayload {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export interface IRecruitmentListQuery {
  page: number;
  limit: number;
}

