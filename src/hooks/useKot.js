import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import KotService from '../services/kotService';
import { useAuth } from '../context/AuthContext';

/* ── Fetch all active KOTs for branch ── */
export function useKots() {
  const { session } = useAuth();
  const branchId = session?.branchId || 1;

  return useQuery({
    queryKey: ['kots', branchId],
    queryFn: () =>
      KotService.getKots(branchId)
        .then(r => r.data?.data ?? []),
    refetchInterval: 15_000,  // auto-refresh every 15 seconds
    staleTime: 0,             // always fresh for kitchen display
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/* ── Update KOT status ── */
export function useUpdateKotStatus() {
  const { session } = useAuth();
  const branchId    = session?.branchId || 1;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kotId, displayStatus }) =>
      KotService.updateKotStatus(kotId, displayStatus)
        .then(r => r.data?.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kots', branchId] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

/* ── Update individual KOT item status ── */
export function useUpdateKotItemStatus() {
  const { session } = useAuth();
  const branchId    = session?.branchId || 1;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kotId, itemId, displayStatus }) =>
      KotService.updateKotItemStatus(kotId, itemId, displayStatus)
        .then(r => r.data?.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kots', branchId] });
    },
  });
}
