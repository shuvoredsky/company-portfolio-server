import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { BannerRoutes } from '../modules/banner/banner.route';
import { BlogRoutes } from '../modules/blog/blog.route';
import { ContactRoutes } from '../modules/contact/contact.route';
import { RecruitmentRoutes } from '../modules/recruitment/recruitment.route';
import { StatsRoutes } from '../modules/stats/stats.route';

const router = Router();

interface ModuleRoute {
  path: string;
  route: Router;
}

const moduleRoutes: ModuleRoute[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/banners',
    route: BannerRoutes,
  },
  {
    path: '/blogs',
    route: BlogRoutes,
  },
  {
    path: '/recruitments',
    route: RecruitmentRoutes,
  },
  {
    path: '/contacts',
    route: ContactRoutes,
  },
  {
    path: '/admin',
    route: StatsRoutes,
  },
];

for (const item of moduleRoutes) {
  router.use(item.path, item.route);
}

export default router;
