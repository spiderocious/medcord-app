import { ConflictError, NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';

import { hospitalUnitRepo } from './hospital-unit.repo.js';
import type { CreateUnitBody, UpdateUnitBody } from './hospital-unit.schema.js';

export const hospitalUnitService = {
  async list(hospitalId: string) {
    return hospitalUnitRepo.findByHospital(hospitalId);
  },

  async listActive(hospitalId: string) {
    return hospitalUnitRepo.findActiveByHospital(hospitalId);
  },

  async create(hospitalId: string, body: CreateUnitBody) {
    const existing = await hospitalUnitRepo.findByName(hospitalId, body.name);
    if (existing) throw new ConflictError('A unit with this name already exists');

    if (body.parentId !== undefined) {
      const parent = await hospitalUnitRepo.findById(body.parentId);
      if (!parent || parent.hospitalId !== hospitalId) throw new NotFoundError('Parent unit');
    }

    return hospitalUnitRepo.create({
      id: newId.unit(),
      hospitalId,
      name: body.name,
      type: body.type,
      ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
      isActive: true,
    });
  },

  async update(hospitalId: string, unitId: string, body: UpdateUnitBody) {
    const unit = await hospitalUnitRepo.findById(unitId);
    if (!unit || unit.hospitalId !== hospitalId) throw new NotFoundError('Unit');

    if (body.name !== undefined && body.name !== unit.name) {
      const existing = await hospitalUnitRepo.findByName(hospitalId, body.name);
      if (existing) throw new ConflictError('A unit with this name already exists');
    }

    if (body.parentId !== undefined) {
      const parent = await hospitalUnitRepo.findById(body.parentId);
      if (!parent || parent.hospitalId !== hospitalId) throw new NotFoundError('Parent unit');
    }

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch['name'] = body.name;
    if (body.type !== undefined) patch['type'] = body.type;
    if (body.parentId !== undefined) patch['parentId'] = body.parentId;
    if (body.isActive !== undefined) patch['isActive'] = body.isActive;

    const updated = await hospitalUnitRepo.update(unitId, patch as never);
    if (!updated) throw new NotFoundError('Unit');
    return updated;
  },

  async remove(hospitalId: string, unitId: string) {
    const unit = await hospitalUnitRepo.findById(unitId);
    if (!unit || unit.hospitalId !== hospitalId) throw new NotFoundError('Unit');

    const childCount = await hospitalUnitRepo.countByParent(unitId);
    if (childCount > 0) throw new ConflictError('Cannot delete a unit that has active sub-units');

    await hospitalUnitRepo.remove(unitId);
  },
};
