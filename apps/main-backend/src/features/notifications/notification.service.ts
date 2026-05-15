import { NotFoundError } from '@lib/errors.js';
import { newId } from '@lib/ids.js';
import type { PaginatedResult } from '@shared/types/service.types.js';

import { notificationRepo } from './notification.repo.js';
import type { INotification, NotificationType } from './notification.model.js';

export interface CreateNotificationParams {
  hospitalId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  resourceType?: string;
  resourceId?: string;
}

export const notificationService = {
  async create(params: CreateNotificationParams): Promise<INotification> {
    const notification = await notificationRepo.create({
      id: newId.notification(),
      hospitalId: params.hospitalId,
      recipientId: params.recipientId,
      type: params.type,
      title: params.title,
      body: params.body,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      isRead: false,
    });
    return notification as unknown as INotification;
  },

  async list(
    recipientId: string,
    hospitalId: string,
    onlyUnread: boolean,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<INotification>> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      notificationRepo.findByRecipient(recipientId, hospitalId, onlyUnread, skip, limit),
      notificationRepo.countByRecipient(recipientId, hospitalId, onlyUnread),
    ]);
    return {
      items: items as INotification[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async markRead(
    recipientId: string,
    notificationId: string,
  ): Promise<INotification> {
    const updated = await notificationRepo.markRead(notificationId, recipientId);
    if (!updated) throw new NotFoundError('Notification');
    return updated as INotification;
  },

  async markAllRead(recipientId: string, hospitalId: string): Promise<void> {
    await notificationRepo.markAllRead(recipientId, hospitalId);
  },
};
