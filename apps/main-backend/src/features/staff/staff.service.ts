import { ConflictError, ForbiddenError, NotFoundError } from '@lib/errors.js';
import { emailService } from '@lib/email.js';
import { newId, newRawId } from '@lib/ids.js';
import { hospitalRepo } from '@features/hospitals/hospital.repo.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { staffRepo } from './staff.repo.js';
import type {
  BulkInviteBody,
  CreateRoleBody,
  InviteBody,
  ListStaffQuery,
  UpdateMemberBody,
  UpdateRoleBody,
} from './staff.schema.js';
import type { IHospitalMember } from '@features/hospitals/hospital.model.js';
import type { ICustomRole } from './staff.model.js';

const INVITE_TTL_DAYS = 7;

const makeInviteExpiry = () => {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
};

export const staffService = {
  async invite(hospitalId: string, invitedBy: string, body: InviteBody) {
    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');

    const existing = await staffRepo.findPendingInvitation(hospitalId, body.email);
    if (existing) throw new ConflictError('A pending invitation already exists for this email');

    const invitation = await staffRepo.createInvitation({
      id: newId.invitation(),
      hospitalId,
      email: body.email,
      role: body.role,
      department: body.department,
      unit: body.unit,
      invitedBy,
      token: newRawId(),
      status: 'pending',
      expiresAt: makeInviteExpiry(),
    });

    await emailService.sendStaffInvitation({
      to: body.email,
      inviterName: invitedBy,
      hospitalName: hospital.name,
      role: body.role,
      inviteUrl: `${process.env['APP_BASE_URL']}/invite/${invitation.token}`,
    });

    return invitation;
  },

  async bulkInvite(hospitalId: string, invitedBy: string, body: BulkInviteBody) {
    return Promise.all(body.invitations.map((inv) => staffService.invite(hospitalId, invitedBy, inv)));
  },

  async listInvitations(hospitalId: string) {
    return staffRepo.listInvitations(hospitalId);
  },

  async revokeInvitation(hospitalId: string, invitationId: string) {
    const inv = await staffRepo.findInvitationById(invitationId);
    if (!inv || inv.hospitalId !== hospitalId) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is not pending');
    return staffRepo.updateInvitation(invitationId, { status: 'revoked' });
  },

  async resendInvitation(hospitalId: string, invitationId: string) {
    const inv = await staffRepo.findInvitationById(invitationId);
    if (!inv || inv.hospitalId !== hospitalId) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is not pending');

    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');

    const updated = await staffRepo.updateInvitation(invitationId, {
      token: newRawId(),
      expiresAt: makeInviteExpiry(),
    });

    await emailService.sendStaffInvitation({
      to: inv.email,
      inviterName: inv.invitedBy,
      hospitalName: hospital.name,
      role: inv.role,
      inviteUrl: `${process.env['APP_BASE_URL']}/invite/${updated?.token}`,
    });

    return updated;
  },

  async acceptInvitation(token: string, userId: string) {
    const inv = await staffRepo.findInvitationByToken(token);
    if (!inv) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
    if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');

    const existingMember = await staffRepo.findMember(inv.hospitalId, userId);
    if (existingMember) throw new ConflictError('Already a member of this hospital');

    await hospitalRepo.createMember({
      id: newId.member(),
      hospitalId: inv.hospitalId,
      userId,
      role: inv.role,
      department: inv.department,
      unit: inv.unit,
      status: 'active',
      joinedAt: new Date(),
    });

    await staffRepo.updateInvitation(inv.id, { status: 'accepted' });
    return { hospitalId: inv.hospitalId };
  },

  async declineInvitation(token: string) {
    const inv = await staffRepo.findInvitationByToken(token);
    if (!inv) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
    return staffRepo.updateInvitation(inv.id, { status: 'declined' });
  },

  async listStaff(hospitalId: string, query: ListStaffQuery): Promise<PaginatedResult<IHospitalMember>> {
    const skip = (query.page - 1) * query.limit;
    const filters = { role: query.role, status: query.status };
    const [items, total] = await Promise.all([
      staffRepo.listMembers(hospitalId, filters, skip, query.limit),
      staffRepo.countMembers(hospitalId, filters),
    ]);
    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async getMember(hospitalId: string, memberId: string) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    return member;
  },

  async updateMember(hospitalId: string, memberId: string, body: UpdateMemberBody) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    return staffRepo.updateMember(memberId, body as Partial<IHospitalMember>);
  },

  async suspendMember(hospitalId: string, memberId: string, requesterId: string) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    if (member.userId === requesterId) throw new ForbiddenError('Cannot suspend yourself');
    return staffRepo.updateMember(memberId, { status: 'suspended' });
  },

  async activateMember(hospitalId: string, memberId: string) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    return staffRepo.updateMember(memberId, { status: 'active' });
  },

  async removeMember(hospitalId: string, memberId: string, requesterId: string) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    if (member.userId === requesterId) throw new ForbiddenError('Cannot remove yourself');
    return staffRepo.deleteMember(memberId);
  },

  async listRoles(hospitalId: string) {
    return staffRepo.listRoles(hospitalId);
  },

  async createRole(hospitalId: string, body: CreateRoleBody) {
    return staffRepo.createRole({
      id: newId.role(),
      hospitalId,
      name: body.name,
      slug: body.slug,
      permissions: body.permissions,
    });
  },

  async updateRole(hospitalId: string, roleId: string, body: UpdateRoleBody) {
    const role = await staffRepo.findRoleById(roleId);
    if (!role || role.hospitalId !== hospitalId) throw new NotFoundError('Role');
    return staffRepo.updateRole(roleId, body as Partial<ICustomRole>);
  },

  async getOrgChart(hospitalId: string) {
    const members = await staffRepo.orgChart(hospitalId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      department: m.department,
      managerId: m.managerId,
    }));
  },

  getShareInfo(hospitalId: string) {
    const baseUrl = process.env['WEB_BASE_URL'] ?? '';
    return {
      workspaceUrl: `${baseUrl}/h/${hospitalId}`,
      inviteUrl: `${baseUrl}/h/${hospitalId}/join`,
    };
  },
};
