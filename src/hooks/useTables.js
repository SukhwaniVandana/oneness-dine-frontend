import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TableService from '../services/tableService';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────────────────
   useTables — uses /tables/dashboard which returns
   richer data including activeOrders[] per table
   tableStatus values: AVAILABLE|OCCUPIED|RESERVED|MERGED|BLOCKED
   We normalize AVAILABLE → FREE for consistency in UI
───────────────────────────────────────────────────── */
function normalizeTable(t) {
  return {
    ...t,
    id:          t.tableId || t.id,
    tableStatus: t.tableStatus === 'AVAILABLE' ? 'FREE' : (t.tableStatus || 'FREE'),
    // activeOrders[] is already in the response from dashboard endpoint
    activeOrders: t.activeOrders || [],
  };
}

export function useTables() {
  const { session } = useAuth();
  const branchId = session?.branchId || 1;

  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: () =>
      TableService.getDashboard(branchId)
        .then(r => (r.data?.data ?? r.data ?? []).map(normalizeTable)),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 2,
  });
}

/* Fallback: invalidate tables after mutations */
export function useInvalidateTables() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const branchId = session?.branchId || 1;
  return () => queryClient.invalidateQueries({ queryKey: ['tables', branchId] });
}
