import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TableService from '../services/tableService';

const BRANCH_ID = 1; // TODO: get from auth context after login

/* ─────────────────────────────────────────────────────────
   STATUS NORMALIZER
   Backend returns "AVAILABLE" — we normalize to "FREE"
   so the rest of the UI uses consistent values.
   Backend → Frontend mapping:
     AVAILABLE  → FREE
     OCCUPIED   → OCCUPIED
     RESERVED   → RESERVED
     BILLING    → BILLING
───────────────────────────────────────────────────────── */
function normalizeStatus(status) {
  if (!status) return 'FREE';
  if (status === 'AVAILABLE') return 'FREE';
  return status.toUpperCase();
}

function normalizeTables(tables) {
  if (!Array.isArray(tables)) return [];
  return tables.map(t => ({
    ...t,
    tableStatus: normalizeStatus(t.tableStatus),
  }));
}

/* ─────────────────────────────────────────────────────────
   useTables
   Response shape: { success: true, data: [...], timestamp }
   We unwrap: r.data?.data  (axios wraps in r.data, then
   our backend wraps in { data: [...] })
───────────────────────────────────────────────────────── */
export function useTables() {
  return useQuery({
    queryKey: ['tables', BRANCH_ID],
    queryFn: () =>
      TableService.getAllTables(BRANCH_ID)
        .then(r => normalizeTables(r.data?.data ?? r.data ?? [])),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 2,
  });
}

/* ─────────────────────────────────────────────────────────
   useTableSummary
   Derives counts from useTables cache if no summary endpoint
───────────────────────────────────────────────────────── */
export function useTableSummary() {
  return useQuery({
    queryKey: ['tables-summary', BRANCH_ID],
    queryFn: () =>
      TableService.getSummary(BRANCH_ID)
        .then(r => r.data?.data ?? r.data)
        .catch(() => null),   // summary endpoint may not exist yet — fail silently
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });
}

/* ─────────────────────────────────────────────────────────
   useOpenSession
───────────────────────────────────────────────────────── */
export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, covers }) =>
      TableService.openSession(tableId, { covers }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['tables-summary'] });
    },
  });
}

/* ─────────────────────────────────────────────────────────
   useUpdateTableStatus
───────────────────────────────────────────────────────── */
export function useUpdateTableStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, status }) =>
      TableService.updateStatus(tableId, status).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
