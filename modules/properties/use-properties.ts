import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Property {
  id: string;
  name: string;
  location: string;
  unitCount: number;
  occupiedCount: number;
}

/**
 * Reference implementation for module hooks — every other module
 * (leases, payments, maintenance, reports) should follow this shape:
 * a typed fetcher + a `useXyz` hook with a namespaced query key.
 */
export function useProperties(landlordId: string) {
  return useQuery({
    queryKey: ['properties', landlordId],
    queryFn: () => apiClient.get<Property[]>(`/properties?landlordId=${landlordId}`),
    enabled: !!landlordId,
  });
}
