import { UserModel } from '@features/auth/auth.model.js';
import { HospitalModel, HospitalMemberModel } from '@features/hospitals/hospital.model.js';

// ── Hospital filters ──────────────────────────────────────────────────────────

interface HospitalFilters {
  q?: string | undefined;
  isArchived?: boolean | undefined;
}

function buildHospitalFilter(filters: HospitalFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (filters.isArchived !== undefined) filter['isArchived'] = filters.isArchived;
  if (filters.q) {
    filter['$or'] = [
      { name: new RegExp(filters.q, 'i') },
      { subdomain: new RegExp(filters.q, 'i') },
    ];
  }
  return filter;
}

// ── User filters ──────────────────────────────────────────────────────────────

interface UserFilters {
  q?: string | undefined;
  isAdmin?: boolean | undefined;
}

function buildUserFilter(filters: UserFilters): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (filters.isAdmin !== undefined) filter['isAdmin'] = filters.isAdmin;
  if (filters.q) {
    filter['$or'] = [
      { name: new RegExp(filters.q, 'i') },
      { email: new RegExp(filters.q, 'i') },
    ];
  }
  return filter;
}

// ── Repo ──────────────────────────────────────────────────────────────────────

export const adminRepo = {
  // Hospitals
  listHospitals: (filters: HospitalFilters, skip: number, limit: number) =>
    HospitalModel.find(buildHospitalFilter(filters)).skip(skip).limit(limit).lean(),

  countHospitals: (filters: HospitalFilters) =>
    HospitalModel.countDocuments(buildHospitalFilter(filters)),

  findHospitalById: (id: string) =>
    HospitalModel.findOne({ id }).lean(),

  updateHospital: (id: string, data: Record<string, unknown>) =>
    HospitalModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  hardDeleteHospital: (id: string) =>
    HospitalModel.deleteOne({ id }),

  countHospitalMembers: (hospitalId: string) =>
    HospitalMemberModel.countDocuments({ hospitalId }),

  // Users
  listUsers: (filters: UserFilters, skip: number, limit: number) =>
    UserModel.find(buildUserFilter(filters))
      .select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')
      .skip(skip)
      .limit(limit)
      .lean(),

  countUsers: (filters: UserFilters) =>
    UserModel.countDocuments(buildUserFilter(filters)),

  findUserById: (id: string) =>
    UserModel.findOne({ id })
      .select('-passwordHash -twoFactorSecret -pendingTwoFactorSecret -tokenVersion')
      .lean(),

  updateUser: (id: string, data: Record<string, unknown>) =>
    UserModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  bumpTokenVersion: (id: string) =>
    UserModel.findOneAndUpdate({ id }, { $inc: { tokenVersion: 1 } }),

  findMembershipsByUserId: (userId: string) =>
    HospitalMemberModel.find({ userId }).lean(),

  // Stats
  statsHospitals: () =>
    Promise.all([
      HospitalModel.countDocuments({}),
      HospitalModel.countDocuments({ isArchived: false }),
      HospitalModel.countDocuments({ isArchived: true }),
    ]),

  statsUsers: () =>
    Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ isAdmin: true }),
      UserModel.countDocuments({ twoFactorEnabled: true }),
    ]),

  countCreatedSince: (model: 'hospital' | 'user', since: Date) => {
    if (model === 'hospital') return HospitalModel.countDocuments({ createdAt: { $gte: since } });
    return UserModel.countDocuments({ createdAt: { $gte: since } });
  },
};
