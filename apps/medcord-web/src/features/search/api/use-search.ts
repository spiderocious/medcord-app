import { useQuery } from '@tanstack/react-query';
import { apiClient, EP } from '@medcord/api';
import type { SearchResults } from '../shared/types/search.ts';

type SearchResponse = { data: { results: SearchResults } };

export function useGlobalSearch(hospitalId: string, q: string, limit = 5) {
  return useQuery({
    queryKey: ['search', hospitalId, q, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ q, limit: String(limit) });
      const r = await apiClient
        .get(`${EP.HOSPITAL_SEARCH(hospitalId)}?${params.toString()}`)
        .json<SearchResponse>();
      return r.data.results;
    },
    enabled: !!hospitalId && q.trim().length >= 2,
    staleTime: 10_000,
  });
}
