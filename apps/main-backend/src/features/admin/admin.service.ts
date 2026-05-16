import { NotFoundError } from '@lib/errors.js';
import type { PaginatedResult } from '@shared/types/service.types.js';
import type { IHospital } from '@features/hospitals/hospital.model.js';
import type { IUser } from '@features/auth/auth.model.js';

import { adminRepo } from './admin.repo.js';

export const adminService = {
  // ── Hospitals ───────────────────────────────────────────────────────────────

  async listHospitals(
    q: string | undefined,
    isArchived: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IHospital>> {
    const filters = { q, isArchived };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      adminRepo.listHospitals(filters, skip, limit),
      adminRepo.countHospitals(filters),
    ]);
    return {
      items: items as IHospital[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getHospital(hospitalId: string) {
    const hospital = await adminRepo.findHospitalById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    const memberCount = await adminRepo.countHospitalMembers(hospitalId);
    return { hospital, memberCount };
  },

  async updateHospital(hospitalId: string, data: Record<string, unknown>) {
    const hospital = await adminRepo.findHospitalById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    const updated = await adminRepo.updateHospital(hospitalId, data);
    if (!updated) throw new NotFoundError('Hospital');
    return updated;
  },

  async deleteHospital(hospitalId: string) {
    const hospital = await adminRepo.findHospitalById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    await adminRepo.hardDeleteHospital(hospitalId);
  },

  // ── Users ───────────────────────────────────────────────────────────────────

  async listUsers(
    q: string | undefined,
    isAdmin: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IUser>> {
    const filters = { q, isAdmin };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      adminRepo.listUsers(filters, skip, limit),
      adminRepo.countUsers(filters),
    ]);
    return {
      items: items as IUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getUser(userId: string) {
    const user = await adminRepo.findUserById(userId);
    if (!user) throw new NotFoundError('User');
    const memberships = await adminRepo.findMembershipsByUserId(userId);
    return { user, memberships };
  },

  async updateUser(userId: string, data: { isAdmin?: boolean | undefined; isEmailVerified?: boolean | undefined }) {
    const user = await adminRepo.findUserById(userId);
    if (!user) throw new NotFoundError('User');
    const update: Record<string, unknown> = {};
    if (data.isAdmin !== undefined) update['isAdmin'] = data.isAdmin;
    if (data.isEmailVerified !== undefined) update['isEmailVerified'] = data.isEmailVerified;
    return adminRepo.updateUser(userId, update);
  },

  async disableUser(userId: string) {
    const user = await adminRepo.findUserById(userId);
    if (!user) throw new NotFoundError('User');
    await adminRepo.bumpTokenVersion(userId);
  },

  // ── Stats ───────────────────────────────────────────────────────────────────

  async getStats() {
    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      [totalHospitals, activeHospitals, archivedHospitals],
      [totalUsers, adminUsers, twoFactorUsers],
      newUsersLast7d,
      newUsersLast30d,
      newHospitalsLast7d,
      newHospitalsLast30d,
    ] = await Promise.all([
      adminRepo.statsHospitals(),
      adminRepo.statsUsers(),
      adminRepo.countCreatedSince('user', last7d),
      adminRepo.countCreatedSince('user', last30d),
      adminRepo.countCreatedSince('hospital', last7d),
      adminRepo.countCreatedSince('hospital', last30d),
    ]);

    return {
      hospitals: {
        total: totalHospitals,
        active: activeHospitals,
        archived: archivedHospitals,
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        twoFactorEnabled: twoFactorUsers,
      },
      recentSignups: {
        last7d: newUsersLast7d,
        last30d: newUsersLast30d,
      },
      recentHospitals: {
        last7d: newHospitalsLast7d,
        last30d: newHospitalsLast30d,
      },
    };
  },
};
