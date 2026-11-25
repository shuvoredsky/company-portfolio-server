import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';
import { IAdmin, IAdminModel } from './auth.interface';

const BCRYPT_SALT_ROUNDS = 12;

const adminSchema = new Schema<IAdmin, IAdminModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      default: 'Admin',
    },
    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      immutable: true,
    },
  },
  {
    timestamps: true,
  },
);

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
});

adminSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
};

export const Admin = model<IAdmin, IAdminModel>('Admin', adminSchema);
