export interface IRecentContactItem {
  id: string;
  name: string;
  email: string;
  country: string;
  createdAt?: Date;
  isRead: boolean;
}

export interface IAdminStatsResponse {
  counts: {
    banners: number;
    blogs: number;
    recruitments: number;
    contacts: number;
    unreadContacts: number;
  };
  recentContacts: IRecentContactItem[];
}
