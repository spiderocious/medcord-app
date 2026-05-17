import bcrypt from 'bcrypt';

import { ConflictError, ForbiddenError, NotFoundError } from '@lib/errors.js';
import { emailService } from '@lib/email.js';
import { newId, newRawId } from '@lib/ids.js';
import { signAccessToken, signRefreshToken } from '@lib/jwt.js';
import { resolveAllPermissions } from '@lib/permissions.js';
import { hospitalRepo } from '@features/hospitals/hospital.repo.js';
import { authRepo } from '@features/auth/auth.repo.js';
import { UserModel } from '@features/auth/auth.model.js';
import { HospitalMemberModel } from '@features/hospitals/hospital.model.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { PERMISSION_DESCRIPTIONS, PERMISSION_GROUPS } from '@medcord/rbac';
import { resolvePermissions } from '@lib/permissions.js';

import { staffRepo } from './staff.repo.js';
import type {
  AcceptInvitationBody,
  BulkInviteBody,
  CreateRoleBody,
  InviteBody,
  ListStaffQuery,
  UpdateMemberBody,
  UpdateRoleBody,
} from './staff.schema.js';
import type { IHospitalMember } from '@features/hospitals/hospital.model.js';
import type { ICustomRole } from './staff.model.js';

type MemberWithUser = IHospitalMember & { name: string; email: string; photoKey?: string | undefined };

async function enrichMembers(members: IHospitalMember[]): Promise<MemberWithUser[]> {
  if (members.length === 0) return [];
  const userIds = members.map((m) => m.userId);
  const users = await UserModel.find({ id: { $in: userIds } }).select('id name email photoKey').lean();
  const userMap = new Map(users.map((u) => [u.id, u]));
  return members.map((m) => {
    const u = userMap.get(m.userId);
    return { ...m, name: u?.name ?? '', email: u?.email ?? '', photoKey: u?.photoKey ?? undefined };
  });
}

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

    const roleExists = await staffRepo.findRoleBySlug(hospitalId, body.role);
    if (!roleExists) throw new NotFoundError('Role');

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

    const inviter = await authRepo.findById(invitedBy);
    await emailService.sendStaffInvitation({
      to: body.email,
      inviterName: inviter?.name ?? 'A team member',
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

    const inviter = await authRepo.findById(inv.invitedBy);
    await emailService.sendStaffInvitation({
      to: inv.email,
      inviterName: inviter?.name ?? 'A team member',
      hospitalName: hospital.name,
      role: inv.role,
      inviteUrl: `${process.env['APP_BASE_URL']}/invite/${updated?.token}`,
    });

    return updated;
  },

  async acceptInvitation(token: string, body: AcceptInvitationBody) {
    const inv = await staffRepo.findInvitationByToken(token);
    if (!inv) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
    if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');

    const existingUser = await authRepo.findByEmail(inv.email);
    if (existingUser) throw new ConflictError('An account with this email already exists. Please log in to accept your invitation.');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const userId = newId.user();
    await authRepo.create({
      id: userId,
      email: inv.email,
      name: body.name,
      passwordHash,
      isEmailVerified: true,
      isAdmin: false,
      twoFactorEnabled: false,
      tokenVersion: 0,
    });

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

    const hospital = await hospitalRepo.findById(inv.hospitalId);
    const memberships = await HospitalMemberModel.find({ userId, status: 'active' }).lean();
    const hospitalPermissions = await resolveAllPermissions(memberships as Parameters<typeof resolveAllPermissions>[0]);
    const accessToken = signAccessToken({ sub: userId, email: inv.email, tokenVersion: 0, hospitalPermissions });
    const refreshToken = signRefreshToken({ sub: userId, tokenVersion: 0 });

    return {
      hospitalId: inv.hospitalId,
      hospitalSlug: hospital?.subdomain ?? '',
      accessToken,
      refreshToken,
    };
  },

  async getInvitationByToken(token: string) {
    const inv = await staffRepo.findInvitationByToken(token);
    if (!inv) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
    if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');

    const [hospital, inviter] = await Promise.all([
      hospitalRepo.findById(inv.hospitalId),
      authRepo.findById(inv.invitedBy),
    ]);

    return {
      invitation: {
        email: inv.email,
        role: inv.role,
        department: inv.department ?? undefined,
        expiresAt: inv.expiresAt,
      },
      hospital: {
        name: hospital?.name ?? '',
        slug: hospital?.subdomain ?? '',
        logoKey: hospital?.logoKey ?? undefined,
        location: hospital?.location ?? '',
      },
      invitedBy: {
        name: inviter?.name ?? 'A team member',
      },
    };
  },

  async declineInvitation(token: string) {
    const inv = await staffRepo.findInvitationByToken(token);
    if (!inv) throw new NotFoundError('Invitation');
    if (inv.status !== 'pending') throw new ConflictError('Invitation is no longer valid');
    if (inv.expiresAt < new Date()) throw new ConflictError('Invitation has expired');
    return staffRepo.updateInvitation(inv.id, { status: 'declined' });
  },

  async listStaff(hospitalId: string, query: ListStaffQuery): Promise<PaginatedResult<MemberWithUser>> {
    const skip = (query.page - 1) * query.limit;
    const filters = { role: query.role, status: query.status, q: query.q };
    const [members, total] = await Promise.all([
      staffRepo.listMembers(hospitalId, filters, skip, query.limit),
      staffRepo.countMembers(hospitalId, filters),
    ]);
    const items = await enrichMembers(members as IHospitalMember[]);
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
    const [enriched] = await enrichMembers([member as IHospitalMember]);
    return enriched;
  },

  async getMyMembership(hospitalId: string, userId: string) {
    const member = await staffRepo.findMember(hospitalId, userId);
    if (!member) throw new NotFoundError('Staff membership');
    const [enriched] = await enrichMembers([member as IHospitalMember]);
    const permissions = await resolvePermissions(member as IHospitalMember);
    return { ...enriched, permissions };
  },

  async updateMember(hospitalId: string, memberId: string, body: UpdateMemberBody) {
    const member = await staffRepo.findMemberById(memberId);
    if (!member || member.hospitalId !== hospitalId) throw new NotFoundError('Staff member');
    if (body.role !== undefined) {
      const roleExists = await staffRepo.findRoleBySlug(hospitalId, body.role);
      if (!roleExists) throw new NotFoundError('Role');
    }
    const updated = await staffRepo.updateMember(memberId, body as Partial<IHospitalMember>);
    // If role changed, revoke the user's session so permissions are re-resolved at next login
    if (body.role !== undefined && body.role !== member.role) {
      await authRepo.bumpTokenVersion(member.userId);
    }
    return updated;
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
    const roles = await staffRepo.listRoles(hospitalId);
    return {
      roles,
      permissionDescriptions: PERMISSION_DESCRIPTIONS,
      permissionGroups: PERMISSION_GROUPS,
    };
  },

  async createRole(hospitalId: string, body: CreateRoleBody) {
    return staffRepo.createRole({
      id: newId.role(),
      hospitalId,
      name: body.name,
      slug: body.slug,
      permissions: body.permissions,
      isSystem: false,
    });
  },

  async deleteRole(hospitalId: string, roleId: string) {
    const role = await staffRepo.findRoleById(roleId);
    if (!role || role.hospitalId !== hospitalId) throw new NotFoundError('Role');
    if (role.isSystem) throw new ForbiddenError('System roles cannot be deleted');
    return staffRepo.deleteRole(roleId);
  },

  async updateRole(hospitalId: string, roleId: string, body: UpdateRoleBody) {
    const role = await staffRepo.findRoleById(roleId);
    if (!role || role.hospitalId !== hospitalId) throw new NotFoundError('Role');
    if (role.isSystem) throw new ForbiddenError('System roles cannot be modified');
    const updated = await staffRepo.updateRole(roleId, body as Partial<ICustomRole>);
    // If permissions changed, revoke sessions of all members assigned this custom role
    if (body.permissions !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const affectedMembers = await HospitalMemberModel.find({ hospitalId, role: role.slug } as any).lean();
      await Promise.all(affectedMembers.map((m) => authRepo.bumpTokenVersion(m.userId)));
    }
    return updated;
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
