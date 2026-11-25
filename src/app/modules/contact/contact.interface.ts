export interface IContact {
  name: string;
  country: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateContactPayload {
  name: string;
  country: string;
  phone: string;
  email: string;
  message: string;
  website?: string;
}

export interface IContactListQuery {
  page: number;
  limit: number;
  isRead?: boolean;
  search?: string;
}
