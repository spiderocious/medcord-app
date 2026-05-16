import { UserModel, type IUser } from './auth.model.js';

export const authRepo = {
  findByEmail: (email: string) =>
    UserModel.findOne({ email }).select('+passwordHash +tokenVersion').lean(),

  findById: (id: string) =>
    UserModel.findOne({ id }).lean(),

  findByIdTokenVersion: (id: string) =>
    UserModel.findOne({ id }).select('+tokenVersion').lean<{ tokenVersion: number } | null>(),

  findByIdWithSecrets: (id: string) =>
    UserModel.findOne({ id }).select('+passwordHash +pendingTwoFactorSecret +twoFactorSecret +tokenVersion').lean(),

  create: (data: Omit<IUser, 'createdAt' | 'updatedAt'>) =>
    UserModel.create(data),

  updateById: (id: string, data: Partial<IUser>) =>
    UserModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  bumpTokenVersion: (id: string) =>
    UserModel.findOneAndUpdate({ id }, { $inc: { tokenVersion: 1 } }, { new: true })
      .select('+tokenVersion')
      .lean(),
};
