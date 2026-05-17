import type { ICustomRole, IInvitation } from './staff.model.js';
import { CustomRoleModel, InvitationModel } from './staff.model.js';
import { HospitalMemberModel } from '@features/hospitals/hospital.model.js';
import type { IHospitalMember } from '@features/hospitals/hospital.model.js';
import { UserModel } from '@features/auth/auth.model.js';

export const staffRepo = {
  // ── Invitations ───────────────────────────────────────────────────────────

  createInvitation: (data: Omit<IInvitation, 'createdAt' | 'updatedAt'>) =>
    InvitationModel.create(data),

  findInvitationByToken: (token: string) => InvitationModel.findOne({ token }).lean(),

  findInvitationById: (id: string) => InvitationModel.findOne({ id }).lean(),

  findPendingInvitation: (hospitalId: string, email: string) =>
    InvitationModel.findOne({ hospitalId, email, status: 'pending' }).lean(),

  listInvitations: (hospitalId: string) =>
    InvitationModel.find({ hospitalId, status: 'pending' }).lean(),

  updateInvitation: (id: string, data: Partial<IInvitation>) =>
    InvitationModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  // ── Members ────────────────────────────────────────────────────────────────

  findMember: (hospitalId: string, userId: string) =>
    HospitalMemberModel.findOne({ hospitalId, userId }).lean(),

  findMembershipsByUserId: (userId: string) =>
    HospitalMemberModel.find({ userId }).lean(),

  findMemberById: (id: string) => HospitalMemberModel.findOne({ id }).lean(),

  listMembers: async (
    hospitalId: string,
    filters: { role?: string | undefined; status?: 'active' | 'suspended' | undefined; q?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const query: Record<string, unknown> = { hospitalId };
    if (filters.role) query['role'] = filters.role;
    if (filters.status) query['status'] = filters.status;
    if (filters.q) {
      const regex = new RegExp(filters.q, 'i');
      const matchingUsers = await UserModel.find({ $or: [{ name: regex }, { email: regex }] })
        .select('id')
        .lean();
      query['userId'] = { $in: matchingUsers.map((u) => u.id) };
    }
    return HospitalMemberModel.find(query).skip(skip).limit(limit).lean();
  },

  countMembers: async (
    hospitalId: string,
    filters: { role?: string | undefined; status?: 'active' | 'suspended' | undefined; q?: string | undefined },
  ) => {
    const query: Record<string, unknown> = { hospitalId };
    if (filters.role) query['role'] = filters.role;
    if (filters.status) query['status'] = filters.status;
    if (filters.q) {
      const regex = new RegExp(filters.q, 'i');
      const matchingUsers = await UserModel.find({ $or: [{ name: regex }, { email: regex }] })
        .select('id')
        .lean();
      query['userId'] = { $in: matchingUsers.map((u) => u.id) };
    }
    return HospitalMemberModel.countDocuments(query);
  },

  updateMember: (id: string, data: Partial<IHospitalMember>) =>
    HospitalMemberModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  deleteMember: (id: string) => HospitalMemberModel.deleteOne({ id }),

  orgChart: (hospitalId: string) =>
    HospitalMemberModel.find({ hospitalId, status: 'active' }).lean(),

  // ── Custom Roles ───────────────────────────────────────────────────────────

  createRole: (data: Omit<ICustomRole, 'createdAt' | 'updatedAt'>) =>
    CustomRoleModel.create(data),

  listRoles: (hospitalId: string) => CustomRoleModel.find({ hospitalId }).lean(),

  findRoleById: (id: string) => CustomRoleModel.findOne({ id }).lean(),

  updateRole: (id: string, data: Partial<ICustomRole>) =>
    CustomRoleModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  findRoleBySlug: (hospitalId: string, slug: string) =>
    CustomRoleModel.findOne({ hospitalId, slug }).lean(),

  deleteRole: (id: string) => CustomRoleModel.deleteOne({ id }),
};
