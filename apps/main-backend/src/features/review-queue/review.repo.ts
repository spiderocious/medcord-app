import type { IReviewItem, ReviewItemStatus, ReviewItemType } from './review.model.js';
import { ReviewItemModel } from './review.model.js';

export const reviewRepo = {
  create: (data: Omit<IReviewItem, 'createdAt' | 'updatedAt'>) => ReviewItemModel.create(data),

  findById: (id: string) => ReviewItemModel.findOne({ id }).lean(),

  findByHospital: (
    hospitalId: string,
    filters: { status?: ReviewItemStatus | undefined; type?: ReviewItemType | undefined; priority?: string | undefined },
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.type) q['type'] = filters.type;
    if (filters.priority) q['priority'] = filters.priority;
    return ReviewItemModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByHospital: (
    hospitalId: string,
    filters: { status?: ReviewItemStatus | undefined; type?: ReviewItemType | undefined; priority?: string | undefined },
  ) => {
    const q: Record<string, unknown> = { hospitalId };
    if (filters.status) q['status'] = filters.status;
    if (filters.type) q['type'] = filters.type;
    if (filters.priority) q['priority'] = filters.priority;
    return ReviewItemModel.countDocuments(q);
  },

  updateById: (id: string, data: Partial<IReviewItem>) =>
    ReviewItemModel.findOneAndUpdate({ id }, { $set: data }, { new: true }).lean(),
};
