import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { ReviewItem, ReviewItemStatus, ReviewItemType, ReviewItemPriority, ReviewQueueResult } from '../shared/types/review.ts';

type ReviewQueueResponse = { data: ReviewQueueResult };
type ReviewItemResponse = { data: { item: ReviewItem } };

export interface ReviewQueueFilters {
  status?: ReviewItemStatus;
  type?: ReviewItemType;
  priority?: ReviewItemPriority;
  page?: number;
  limit?: number;
}

export function useReviewQueue(hospitalId: string, filters: ReviewQueueFilters = {}) {
  return useQuery({
    queryKey: ['review-queue', hospitalId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.type) params.set('type', filters.type);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/review-queue${qs ? `?${qs}` : ''}`)
        .json<ReviewQueueResponse>();
      return r.data;
    },
    enabled: !!hospitalId,
  });
}

export function useReviewItem(hospitalId: string, itemId: string) {
  return useQuery({
    queryKey: ['review-item', hospitalId, itemId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/review-queue/${itemId}`)
        .json<ReviewItemResponse>();
      return r.data.item;
    },
    enabled: !!hospitalId && !!itemId,
  });
}

export function useActOnReviewItem(hospitalId: string, itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { action: 'approve' | 'reject' | 'escalate'; note?: string }) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/review-queue/${itemId}/act`, { json: payload })
        .json<ReviewItemResponse>();
      return r.data.item;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['review-queue', hospitalId] });
      void qc.invalidateQueries({ queryKey: ['review-item', hospitalId, itemId] });
      DrawerService.toast('Review action recorded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
