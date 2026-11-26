import { Banner } from '../banner/banner.model';
import { Blog } from '../blog/blog.model';
import { Contact } from '../contact/contact.model';
import { Recruitment } from '../recruitment/recruitment.model';
import { IAdminStatsResponse, IRecentContactItem } from './stats.interface';

const getAdminStats = async (): Promise<IAdminStatsResponse> => {
  const [
    banners,
    blogs,
    recruitments,
    contacts,
    unreadContacts,
    recentContactsDocs,
  ] = await Promise.all([
    Banner.countDocuments(),
    Blog.countDocuments(),
    Recruitment.countDocuments(),
    Contact.countDocuments(),
    Contact.countDocuments({ isRead: false }),
    Contact.find()
      .select('_id name email country createdAt isRead')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const recentContacts: IRecentContactItem[] = recentContactsDocs.map(
    (doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      country: doc.country,
      createdAt: doc.createdAt,
      isRead: doc.isRead,
    }),
  );

  return {
    counts: {
      banners,
      blogs,
      recruitments,
      contacts,
      unreadContacts,
    },
    recentContacts,
  };
};

export const StatsService = {
  getAdminStats,
};

