import { ConflictError, ForbiddenError, NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import { seedDefaultRoles } from '@lib/seed-roles.js';

import { hospitalRepo } from './hospital.repo.js';
import type { IHospital } from './hospital.model.js';
import type {
  CreateHospitalBody,
  TransferOwnershipBody,
  UpdateBrandingBody,
  UpdateDomainBody,
  UpdateHospitalBody,
  UpdateModulesBody,
} from './hospital.schema.js';

export const hospitalService = {
  async create(userId: string, body: CreateHospitalBody) {
    const existing = await hospitalRepo.findBySubdomain(body.subdomain);
    if (existing) throw new ConflictError('Subdomain already taken');

    const hospital = await hospitalRepo.create({
      id: newId.hospital(),
      name: body.name,
      type: body.type,
      location: body.location,
      contact: body.contact ?? {},
      subdomain: body.subdomain,
      branding: {},
      modules: { emr: true, labs: true, assets: true, onlineConsultation: false },
      plan: 'pro',
      ownerId: userId,
      timezone: body.timezone,
      locale: body.locale,
      customDomainVerified: false,
      isArchived: false,
    });

    await hospitalRepo.createMember({
      id: newId.member(),
      hospitalId: hospital.id,
      userId,
      role: 'super_admin',
      status: 'active',
      joinedAt: new Date(),
    });

    await seedDefaultRoles(hospital.id);

    return hospital;
  },

  async listMine(userId: string) {
    const memberships = await hospitalRepo.listByUserId(userId);
    const ids = memberships.map((m) => m.hospitalId);
    const hospitals = await Promise.all(ids.map((id) => hospitalRepo.findById(id)));
    return hospitals.filter(Boolean);
  },

  async get(hospitalId: string) {
    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    await seedDefaultRoles(hospitalId);
    return hospital;
  },

  async update(hospitalId: string, body: UpdateHospitalBody) {
    const hospital = await hospitalRepo.updateById(hospitalId, body as Partial<IHospital>);
    if (!hospital) throw new NotFoundError('Hospital');
    return hospital;
  },

  async updateBranding(hospitalId: string, body: UpdateBrandingBody) {
    const { logoKey, ...brandingFields } = body;
    const update: Record<string, unknown> = {};
    if (logoKey) update['logoKey'] = logoKey;
    Object.entries(brandingFields).forEach(([k, v]) => {
      if (v !== undefined) update[`branding.${k}`] = v;
    });
    const hospital = await hospitalRepo.updateById(hospitalId, update as never);
    if (!hospital) throw new NotFoundError('Hospital');
    return hospital;
  },

  async updateModules(hospitalId: string, body: UpdateModulesBody) {
    const update: Record<string, boolean> = {};
    Object.entries(body).forEach(([k, v]) => {
      if (v !== undefined) update[`modules.${k}`] = v;
    });
    const hospital = await hospitalRepo.updateById(hospitalId, update as never);
    if (!hospital) throw new NotFoundError('Hospital');
    return hospital;
  },

  async getDomain(hospitalId: string) {
    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    return {
      subdomain: hospital.subdomain,
      subdomainUrl: `https://${hospital.subdomain}.Medcord.app`,
      customDomain: hospital.customDomain,
      customDomainVerified: hospital.customDomainVerified,
    };
  },

  async updateDomain(hospitalId: string, body: UpdateDomainBody) {
    const hospital = await hospitalRepo.updateById(hospitalId, body as Partial<IHospital>);
    if (!hospital) throw new NotFoundError('Hospital');
    return hospital;
  },

  async getUsage(hospitalId: string) {
    const memberCount = await hospitalRepo.countMembers(hospitalId);
    return { members: memberCount };
  },

  async transferOwnership(hospitalId: string, requesterId: string, body: TransferOwnershipBody) {
    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    if (hospital.ownerId !== requesterId) throw new ForbiddenError('Only the owner can transfer ownership');

    const newOwnerMember = await hospitalRepo.findMember(hospitalId, body.newOwnerId);
    if (!newOwnerMember) throw new NotFoundError('New owner must be an existing hospital member');

    const previousOwnerMember = await hospitalRepo.findMember(hospitalId, requesterId);

    await hospitalRepo.updateById(hospitalId, { ownerId: body.newOwnerId });
    await hospitalRepo.updateMember(newOwnerMember.id, { role: 'super_admin' });
    if (previousOwnerMember) {
      await hospitalRepo.updateMember(previousOwnerMember.id, { role: 'hospital_admin' });
    }

    return hospitalRepo.findById(hospitalId);
  },

  async archive(hospitalId: string, requesterId: string) {
    const hospital = await hospitalRepo.findById(hospitalId);
    if (!hospital) throw new NotFoundError('Hospital');
    if (hospital.ownerId !== requesterId) throw new ForbiddenError('Only the owner can archive this hospital');
    return hospitalRepo.archive(hospitalId);
  },
};
