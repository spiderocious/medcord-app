import { ConflictError, NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { reviewRepo } from './review.repo.js';
import type { IReviewItem } from './review.model.js';
import type {
  CreateReviewItemBody,
  ListReviewQueueQuery,
  ReviewActionBody,
} from './review.schema.js';

export const reviewService = {
  async create(
    hospitalId: string,
    userId: string,
    body: CreateReviewItemBody,
  ): Promise<IReviewItem> {
    const item = await reviewRepo.create({
      id: newId.reviewItem(),
      hospitalId,
      patientId: body.patientId,
      type: body.type,
      referenceId: body.referenceId,
      title: body.title,
      summary: body.summary,
      priority: body.priority,
      status: 'pending',
      submittedBy: userId,
    });
    return item as unknown as IReviewItem;
  },

  async list(
    hospitalId: string,
    query: ListReviewQueueQuery,
  ): Promise<PaginatedResult<IReviewItem>> {
    const skip = (query.page - 1) * query.limit;
    const filters = { status: query.status, type: query.type, priority: query.priority };
    const [items, total] = await Promise.all([
      reviewRepo.findByHospital(hospitalId, filters, skip, query.limit),
      reviewRepo.countByHospital(hospitalId, filters),
    ]);
    return {
      items: items as IReviewItem[],
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  },

  async get(hospitalId: string, itemId: string): Promise<IReviewItem> {
    const item = await reviewRepo.findById(itemId);
    if (!item || item.hospitalId !== hospitalId) throw new NotFoundError('Review item');
    return item as IReviewItem;
  },

  async act(
    hospitalId: string,
    itemId: string,
    userId: string,
    body: ReviewActionBody,
  ): Promise<IReviewItem> {
    const item = await reviewRepo.findById(itemId);
    if (!item || item.hospitalId !== hospitalId) throw new NotFoundError('Review item');
    if (item.status !== 'pending' && item.status !== 'escalated') {
      throw new ConflictError('Review item has already been resolved');
    }

    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      escalate: 'escalated',
    } as const;

    const updated = await reviewRepo.updateById(itemId, {
      status: statusMap[body.action],
      reviewedBy: userId,
      reviewedAt: new Date(),
      reviewNote: body.note,
    });
    if (!updated) throw new NotFoundError('Review item');
    return updated as IReviewItem;
  },
};
