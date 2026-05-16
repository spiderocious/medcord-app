import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient, EP } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { Asset, AssetCondition, AssetListResult, AssetPhoto, AssetStatus } from '../../../shared/types/asset.ts';

// ── Response types (verified against asset.routes.ts + asset.service.ts) ──────

// GET /api/v1/hospitals/:hospitalId/assets
// Service: PaginatedResult → { items, total, page, limit, totalPages }
// Route: ResponseUtil.ok(res, result) → { data: { items, total, ... } }
type AssetListResponse = { readonly data: AssetListResult };

// GET /api/v1/hospitals/:hospitalId/assets/:assetId
// Route: ResponseUtil.ok(res, { asset }) → { data: { asset } }
type AssetResponse = { readonly data: { readonly asset: Asset } };

// ── List ─────────────────────────────────────────────────────────────────────

export interface AssetFilters {
  readonly status?: AssetStatus;
  readonly category?: string;
  readonly q?: string;
  readonly page?: number;
  readonly limit?: number;
}

export function useAssets(hospitalId: string, filters: AssetFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  if (filters.q) params.set('q', filters.q);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const url = qs ? `${EP.HOSPITAL_ASSETS(hospitalId)}?${qs}` : EP.HOSPITAL_ASSETS(hospitalId);

  return useQuery({
    queryKey: ['assets', hospitalId, filters],
    queryFn: () => apiClient.get(url).json<AssetListResponse>().then((r) => r.data),
    enabled: hospitalId !== '',
  });
}

// ── Single ───────────────────────────────────────────────────────────────────

export function useAsset(hospitalId: string, assetId: string) {
  return useQuery({
    queryKey: ['asset', hospitalId, assetId],
    queryFn: () =>
      apiClient
        .get(EP.HOSPITAL_ASSET(hospitalId, assetId))
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    enabled: hospitalId !== '' && assetId !== '',
  });
}

// ── Create ───────────────────────────────────────────────────────────────────

export interface CreateAssetPayload {
  readonly name: string;
  readonly category: string;
  readonly assetTag?: string;
  readonly manufacturer?: string;
  readonly modelName?: string;
  readonly serialNumber?: string;
  readonly purchaseDate?: string;
  readonly purchasePrice?: number;
  readonly warrantyExpiresAt?: string;
  readonly status?: AssetStatus;
  readonly condition?: AssetCondition;
  readonly currentLocation?: string;
  readonly notes?: string;
  readonly photos?: ReadonlyArray<{ readonly fileKey: string; readonly caption?: string }>;
}

// Route: ResponseUtil.created(res, { asset }) → 201 { data: { asset } }
type CreateAssetResponse = { readonly data: { readonly asset: Asset } };

export function useCreateAsset(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssetPayload) =>
      apiClient
        .post(EP.HOSPITAL_ASSETS(hospitalId), { json: payload })
        .json<CreateAssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets', hospitalId] });
      DrawerService.toast('Asset created.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// ── Update ───────────────────────────────────────────────────────────────────

export interface UpdateAssetPayload {
  readonly name?: string;
  readonly category?: string;
  readonly assetTag?: string;
  readonly manufacturer?: string;
  readonly modelName?: string;
  readonly serialNumber?: string;
  readonly purchaseDate?: string;
  readonly purchasePrice?: number;
  readonly warrantyExpiresAt?: string;
  readonly condition?: AssetCondition;
  readonly notes?: string;
  readonly lastMaintenanceAt?: string;
  readonly nextMaintenanceDue?: string;
}

// Route: ResponseUtil.ok(res, { asset }) → 200 { data: { asset } }
export function useUpdateAsset(hospitalId: string, assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAssetPayload) =>
      apiClient
        .patch(EP.HOSPITAL_ASSET(hospitalId, assetId), { json: payload })
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asset', hospitalId, assetId] });
      void queryClient.invalidateQueries({ queryKey: ['assets', hospitalId] });
      DrawerService.toast('Asset updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// ── Update Status ────────────────────────────────────────────────────────────

export function useUpdateAssetStatus(hospitalId: string, assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { readonly status: AssetStatus; readonly assignedTo?: string }) =>
      apiClient
        .patch(EP.HOSPITAL_ASSET_STATUS(hospitalId, assetId), { json: payload })
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asset', hospitalId, assetId] });
      void queryClient.invalidateQueries({ queryKey: ['assets', hospitalId] });
      DrawerService.toast('Status updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// ── Move ─────────────────────────────────────────────────────────────────────

export function useMoveAsset(hospitalId: string, assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { readonly location: string; readonly note?: string }) =>
      apiClient
        .post(EP.HOSPITAL_ASSET_MOVE(hospitalId, assetId), { json: payload })
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asset', hospitalId, assetId] });
      DrawerService.toast('Asset moved.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// ── Photos ───────────────────────────────────────────────────────────────────

// Route: ResponseUtil.ok(res, { asset }) → 200 { data: { asset } } — HAS BODY
export function useAddAssetPhoto(hospitalId: string, assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetPhoto) =>
      apiClient
        .post(EP.HOSPITAL_ASSET_PHOTOS(hospitalId, assetId), { json: payload })
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asset', hospitalId, assetId] });
      DrawerService.toast('Photo added.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// Route: ResponseUtil.ok(res, { asset }) → 200 { data: { asset } } — HAS BODY (not 204!)
export function useRemoveAssetPhoto(hospitalId: string, assetId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileKey: string) =>
      apiClient
        .delete(EP.HOSPITAL_ASSET_PHOTO(hospitalId, assetId, fileKey))
        .json<AssetResponse>()
        .then((r) => r.data.asset),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['asset', hospitalId, assetId] });
      DrawerService.toast('Photo removed.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}

// ── Delete ───────────────────────────────────────────────────────────────────

// Route: ResponseUtil.noContent(res) → 204, NO .json()
export function useDeleteAsset(hospitalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) =>
      apiClient.delete(EP.HOSPITAL_ASSET(hospitalId, assetId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets', hospitalId] });
      DrawerService.toast('Asset deleted.', { type: 'success' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    },
  });
}
