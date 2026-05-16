import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Notification, NotificationListResult } from '../shared/types/notification.ts';

type NotificationListResponse = { data: NotificationListResult };
type NotificationResponse = { data: { notification: Notification } };

export interface NotificationFilters {
  unread?: boolean;
  page?: number;
  limit?: number;
}

export function useNotifications(hospitalId: string, filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ['notifications', hospitalId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unread) params.set('unread', 'true');
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      const r = await apiClient
        .get(`${EP.HOSPITAL_NOTIFICATIONS(hospitalId)}${qs ? `?${qs}` : ''}`)
        .json<NotificationListResponse>();
      return r.data;
    },
    enabled: !!hospitalId,
  });
}

export function useNotificationBell(hospitalId: string) {
  return useQuery({
    queryKey: ['notifications-bell', hospitalId],
    queryFn: async () => {
      const r = await apiClient
        .get(`${EP.HOSPITAL_NOTIFICATIONS(hospitalId)}?unread=true&limit=1&page=1`)
        .json<NotificationListResponse>();
      return r.data.total;
    },
    enabled: !!hospitalId,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      // Note: EP.NOTIFICATION_READ is wrong (missing hospitalId) — use inline path
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/notifications/${notificationId}/read`)
        .json<NotificationResponse>();
      return r.data.notification;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['notifications-bell', hospitalId] });
    },
  });
}

export function useMarkAllNotificationsRead(hospitalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      // 204 — no .json() call
      await apiClient.post(EP.HOSPITAL_NOTIFICATIONS_READ_ALL(hospitalId));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['notifications-bell', hospitalId] });
      DrawerService.toast('All notifications marked as read.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
