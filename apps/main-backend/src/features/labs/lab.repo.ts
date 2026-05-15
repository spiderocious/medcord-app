import type { ILabOrder, ILabStateHistory, LabOrderStatus } from './lab.model.js';
import { LabOrderModel } from './lab.model.js';

export const labRepo = {
  create: (data: Omit<ILabOrder, 'createdAt' | 'updatedAt'>) => LabOrderModel.create(data),

  findById: (id: string) => LabOrderModel.findOne({ id }).lean(),

  findByHospitalAndPatient: (
    hospitalId: string,
    patientId: string,
    filters: { status?: LabOrderStatus | undefined; priority?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { hospitalId, patientId };
    if (filters.status) q['status'] = filters.status;
    if (filters.priority) q['priority'] = filters.priority;
    return LabOrderModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByHospitalAndPatient: (
    hospitalId: string,
    patientId: string,
    filters: { status?: LabOrderStatus | undefined; priority?: string | undefined },
  ) => {
    const q: Record<string, unknown> = { hospitalId, patientId };
    if (filters.status) q['status'] = filters.status;
    if (filters.priority) q['priority'] = filters.priority;
    return LabOrderModel.countDocuments(q);
  },

  findByHospital: (
    hospitalId: string,
    filters: { status?: LabOrderStatus | undefined; priority?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.priority) q['priority'] = filters.priority;
    return LabOrderModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByHospital: (
    hospitalId: string,
    filters: { status?: LabOrderStatus | undefined; priority?: string | undefined },
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.priority) q['priority'] = filters.priority;
    return LabOrderModel.countDocuments(q);
  },

  updateById: (id: string, data: Partial<ILabOrder>) =>
    LabOrderModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),

  pushStateHistory: (id: string, entry: ILabStateHistory) =>
    LabOrderModel.findOneAndUpdate(
      { id },
      { $push: { stateHistory: entry } },
      { new: true },
    ).lean(),
};
