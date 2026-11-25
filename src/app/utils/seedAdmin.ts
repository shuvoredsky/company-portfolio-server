import mongoose from 'mongoose';
import config from '../../config';
import { Admin } from '../modules/auth/auth.model';

const seedAdmin = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 1) {
    console.warn(
      '[WARN] Database is not connected. Skipping admin seeding.',
    );
    return;
  }

  const adminEmail = config.admin.email.trim().toLowerCase();
  const adminPassword = config.admin.password;

  if (!adminEmail || !adminPassword) {
    console.warn(
      '[WARN] ADMIN_EMAIL or ADMIN_PASSWORD is not configured. Skipping admin seeding.',
    );
    return;
  }

  const existingAdmin = await Admin.findOne({ role: 'admin' }).lean();

  if (existingAdmin) {
    console.log(
      `[INFO] Admin account already exists (${existingAdmin.email}). Skipping seeding.`,
    );
    return;
  }

  await Admin.create({
    email: adminEmail,
    password: adminPassword,
    name: 'Admin',
    role: 'admin',
  });

  console.log(`[INFO] Default admin account seeded (${adminEmail}).`);
};

export default seedAdmin;

