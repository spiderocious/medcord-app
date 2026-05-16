import mongoose, { type Document, Schema } from 'mongoose';

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  photoKey?: string | undefined;
  phone?: string | undefined;
  isEmailVerified: boolean;
  pendingTwoFactorSecret?: string | undefined;
  twoFactorSecret?: string | undefined;
  twoFactorEnabled: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    photoKey: { type: String },
    phone: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    pendingTwoFactorSecret: { type: String, select: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true, collection: 'users' },
);

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
