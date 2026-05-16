import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@medcord/api';
import { DrawerService } from '@medcord/ui';
import type { ChartDocument, ChartDocumentCategory } from '../../../shared/types/emr.ts';

type DocumentListResponse = { data: { documents: readonly ChartDocument[] } };
type DocumentResponse = { data: { document: ChartDocument } };

export function useDocuments(hospitalId: string, patientId: string) {
  return useQuery({
    queryKey: ['chart-documents', hospitalId, patientId],
    queryFn: async () => {
      const r = await apiClient
        .get(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/documents`)
        .json<DocumentListResponse>();
      return r.data.documents;
    },
    enabled: !!hospitalId && !!patientId,
  });
}

export interface AddDocumentPayload {
  title: string;
  category: ChartDocumentCategory;
  fileKey: string;
  isSensitive?: boolean;
}

export function useAddDocument(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddDocumentPayload) => {
      const r = await apiClient
        .post(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/documents`, { json: payload })
        .json<DocumentResponse>();
      return r.data.document;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chart-documents', hospitalId, patientId] });
      DrawerService.toast('Document uploaded.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}

export function useUpdateDocument(hospitalId: string, patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ docId, category, isSensitive }: { docId: string; category?: ChartDocumentCategory; isSensitive?: boolean }) => {
      const r = await apiClient
        .patch(`api/v1/hospitals/${hospitalId}/patients/${patientId}/chart/documents/${docId}`, { json: { category, isSensitive } })
        .json<DocumentResponse>();
      return r.data.document;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['chart-documents', hospitalId, patientId] });
      DrawerService.toast('Document updated.', { type: 'success' });
    },
    onError: (err: unknown) => {
      DrawerService.toast(err instanceof Error ? err.message : 'Something went wrong.', { type: 'error' });
    },
  });
}
