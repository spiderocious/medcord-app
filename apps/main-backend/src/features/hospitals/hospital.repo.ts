import type { StaffRole } from '@shared/types/roles.types.js';

import type { IHospital, IHospitalMember } from './hospital.model.js';
import { HospitalMemberModel, HospitalModel } from './hospital.model.js';

export const hospitalRepo = {
  // ── Hospitals ──────────────────────────────────────────────────────────────

  create: (data: Omit<IHospital, 'createdAt' | 'updatedAt'>) => HospitalModel.create(data),

  findById: (id: string) => HospitalModel.findOne({ id, isArchived: false }).lean(),

  findBySubdomain: (subdomain: string) => HospitalModel.findOne({ subdomain, isArchived: false }).lean(),

  findByOwnerId: (ownerId: string) => HospitalModel.find({ ownerId, isArchived: false }).lean(),

  updateById: (id: string, data: Partial<IHospital>) =>
    HospitalModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  archive: (id: string) =>
    HospitalModel.findOneAndUpdate({ id }, { $set: { isArchived: true } }, { new: true }).lean(),

  // ── Members ────────────────────────────────────────────────────────────────

  createMember: (data: Omit<IHospitalMember, 'createdAt' | 'updatedAt'>) =>
    HospitalMemberModel.create(data),

  findMember: (hospitalId: string, userId: string) =>
    HospitalMemberModel.findOne({ hospitalId, userId }).lean(),

  findMemberById: (id: string) => HospitalMemberModel.findOne({ id }).lean(),

  findMembers: (hospitalId: string) =>
    HospitalMemberModel.find({ hospitalId }).lean(),

  updateMember: (id: string, data: Partial<IHospitalMember>) =>
    HospitalMemberModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  countMembers: (hospitalId: string) =>
    HospitalMemberModel.countDocuments({ hospitalId, status: 'active' }),

  listByUserId: (userId: string) =>
    HospitalMemberModel.find({ userId, status: 'active' }).lean(),

  findMembersByRole: (hospitalId: string, role: StaffRole) =>
    HospitalMemberModel.find({ hospitalId, role, status: 'active' }).lean(),
};
