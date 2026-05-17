import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import type { AuditAction, AuditLogResult } from '@shared/types/audit.ts';

interface AuditFilters {
  readonly action?: AuditAction;
  readonly actorId?: string;
  readonly page: number;
}

export function useAuditLog(hospitalId: string, filters: AuditFilters) {
  return useQuery({
    queryKey: ['audit-log', hospitalId, filters],
    staleTime: 60_000,
    queryFn: async () => {
      const searchParams: Record<string, string> = {
        page: String(filters.page),
        limit: '50',
      };
      if (filters.action) searchParams['action'] = filters.action;
      if (filters.actorId?.trim()) searchParams['actorId'] = filters.actorId.trim();
      const r = await apiClient
        .get(EP.HOSPITAL_AUDIT_LOG(hospitalId), { searchParams })
        .json<{ data: AuditLogResult }>();
      return r.data;
    },
    enabled: hospitalId !== '',
  });
}
