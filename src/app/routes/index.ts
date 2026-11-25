import { Router } from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';

const router = Router();

interface ModuleRoute {
  path: string;
  route: Router;
}

// Feature module routes registered here:
// /auth, /banners, /blogs, /recruitments, /contacts
const moduleRoutes: ModuleRoute[] = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
];

for (const item of moduleRoutes) {
  router.use(item.path, item.route);
}

export default router;
