import type { INotification } from './notification.model.js';
import { NotificationModel } from './notification.model.js';

export const notificationRepo = {
  create: (data: Omit<INotification, 'createdAt'>) => NotificationModel.create(data),

  findByRecipient: (
    recipientId: string,
    hospitalId: string,
    onlyUnread: boolean,
    skip: number,
    limit: number,
  ) => {
    const q: Record<string, unknown> = { recipientId, hospitalId };
    if (onlyUnread) q['isRead'] = false;
    return NotificationModel.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  },

  countByRecipient: (recipientId: string, hospitalId: string, onlyUnread: boolean) => {
    const q: Record<string, unknown> = { recipientId, hospitalId };
    if (onlyUnread) q['isRead'] = false;
    return NotificationModel.countDocuments(q);
  },

  markRead: (id: string, recipientId: string) =>
    NotificationModel.findOneAndUpdate(
      { id, recipientId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    ).lean(),

  markAllRead: (recipientId: string, hospitalId: string) =>
    NotificationModel.updateMany(
      { recipientId, hospitalId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    ),
};
