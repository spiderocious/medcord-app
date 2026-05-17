import type { IHospitalUnit } from './hospital-unit.model.js';
import { HospitalUnitModel } from './hospital-unit.model.js';

export const hospitalUnitRepo = {
  create: (data: Omit<IHospitalUnit, 'createdAt' | 'updatedAt'>) =>
    HospitalUnitModel.create(data),

  findById: (id: string) =>
    HospitalUnitModel.findOne({ id }).lean(),

  findByHospital: (hospitalId: string) =>
    HospitalUnitModel.find({ hospitalId }).sort({ type: 1, name: 1 }).lean(),

  findActiveByHospital: (hospitalId: string) =>
    HospitalUnitModel.find({ hospitalId, isActive: true }).sort({ type: 1, name: 1 }).lean(),

  findByName: (hospitalId: string, name: string) =>
    HospitalUnitModel.findOne({ hospitalId, name: { $regex: new RegExp(`^${name}$`, 'i') } }).lean(),

  update: (id: string, data: Partial<IHospitalUnit>) =>
    HospitalUnitModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  remove: (id: string) =>
    HospitalUnitModel.deleteOne({ id }),

  countByParent: (parentId: string) =>
    HospitalUnitModel.countDocuments({ parentId, isActive: true }),
};
