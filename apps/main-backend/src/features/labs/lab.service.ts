import { ConflictError, NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import { patientRepo } from '@features/patients/patient.repo.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { labRepo } from './lab.repo.js';
import type { ILabOrder, ILabStateHistory, LabOrderStatus } from './lab.model.js';
import type {
  AdvanceStatusBody,
  CreateLabOrderBody,
  ListLabOrdersQuery,
  RecordResultBody,
  UpdateLabOrderBody,
} from './lab.schema.js';

const VALID_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus | null> = {
  awaiting_sample: 'sample_received',
  sample_received: 'awaiting_test',
  awaiting_test: 'in_progress',
  in_progress: 'awaiting_result',
  awaiting_result: 'result_ready',
  result_ready: 'result_released',
  result_released: null,
};

export const labService = {
  async create(
    hospitalId: string,
    patientId: string,
    userId: string,
    body: CreateLabOrderBody,
  ) {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');

    const order = await labRepo.create({
      id: newId.labOrder(),
      hospitalId,
      patientId,
      orderedBy: userId,
      testName: body.testName,
      testCode: body.testCode,
      category: body.category,
      priority: body.priority,
      status: 'awaiting_sample',
      stateHistory: [],
      sampleType: body.sampleType,
      notes: body.notes,
    });

    return order;
  },

  async list(
    hospitalId: string,
    patientId: string,
    userId: string,
    query: ListLabOrdersQuery,
  ): Promise<PaginatedResult<ILabOrder>> {
    const link = await patientRepo.findHospitalPatient(hospitalId, patientId);
    if (!link) throw new NotFoundError('Patient');

    const skip = (query.page - 1) * query.limit;
    const filters = { status: query.status, priority: query.priority };
    const [items, total] = await Promise.all([
      labRepo.findByHospitalAndPatient(hospitalId, patientId, filters, skip, query.limit),
      labRepo.countByHospitalAndPatient(hospitalId, patientId, filters),
    ]);

    void userId;
    return {
      items: items as ILabOrder[],
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async listByHospital(
    hospitalId: string,
    query: ListLabOrdersQuery,
  ): Promise<PaginatedResult<ILabOrder>> {
    const skip = (query.page - 1) * query.limit;
    const filters = { status: query.status, priority: query.priority };
    const [items, total] = await Promise.all([
      labRepo.findByHospital(hospitalId, filters, skip, query.limit),
      labRepo.countByHospital(hospitalId, filters),
    ]);

    return {
      items: items as ILabOrder[],
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async get(hospitalId: string, patientId: string, orderId: string) {
    const order = await labRepo.findById(orderId);
    if (!order || order.hospitalId !== hospitalId || order.patientId !== patientId) {
      throw new NotFoundError('Lab order');
    }
    return order;
  },

  async update(
    hospitalId: string,
    patientId: string,
    orderId: string,
    body: UpdateLabOrderBody,
  ) {
    const order = await labRepo.findById(orderId);
    if (!order || order.hospitalId !== hospitalId || order.patientId !== patientId) {
      throw new NotFoundError('Lab order');
    }
    if (order.status === 'result_released') {
      throw new ConflictError('Cannot edit a released lab order');
    }
    const updated = await labRepo.updateById(orderId, body as Partial<ILabOrder>);
    return updated;
  },

  async advanceStatus(
    hospitalId: string,
    patientId: string,
    orderId: string,
    userId: string,
    body: AdvanceStatusBody,
  ) {
    const order = await labRepo.findById(orderId);
    if (!order || order.hospitalId !== hospitalId || order.patientId !== patientId) {
      throw new NotFoundError('Lab order');
    }

    const nextStatus = VALID_TRANSITIONS[order.status];
    if (!nextStatus) {
      throw new ConflictError('Lab order has reached its final state');
    }

    // result_ready → result_released requires result to be set
    if (nextStatus === 'result_released' && !order.result) {
      throw new ConflictError('Cannot release result without recording it first');
    }

    const historyEntry = {
      from: order.status,
      to: nextStatus,
      changedBy: userId,
      changedAt: new Date(),
      note: body.note,
    };

    const update: Partial<ILabOrder> = { status: nextStatus };

    if (nextStatus === 'sample_received') {
      if (body.sampleType) update.sampleType = body.sampleType;
      if (body.sampleCollectedAt) update.sampleCollectedAt = body.sampleCollectedAt;
      update.sampleCollectedBy = userId;
    }

    if (nextStatus === 'result_released') {
      update.resultReleasedAt = new Date();
      update.resultReleasedBy = userId;
    }

    await labRepo.pushStateHistory(orderId, historyEntry as ILabStateHistory);
    const updated = await labRepo.updateById(orderId, update);
    return updated;
  },

  async recordResult(
    hospitalId: string,
    patientId: string,
    orderId: string,
    body: RecordResultBody,
  ) {
    const order = await labRepo.findById(orderId);
    if (!order || order.hospitalId !== hospitalId || order.patientId !== patientId) {
      throw new NotFoundError('Lab order');
    }

    const allowedStatuses: LabOrderStatus[] = ['awaiting_result', 'result_ready'];
    if (!allowedStatuses.includes(order.status)) {
      throw new ConflictError('Results can only be recorded when order is awaiting_result or result_ready');
    }

    const update: Partial<ILabOrder> = {
      result: {
        value: body.value,
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.referenceRange !== undefined && { referenceRange: body.referenceRange }),
        isAbnormal: body.isAbnormal,
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      status: 'result_ready',
    };
    if (body.fileKey) update.fileKey = body.fileKey;

    const updated = await labRepo.updateById(orderId, update);
    return updated;
  },
};
