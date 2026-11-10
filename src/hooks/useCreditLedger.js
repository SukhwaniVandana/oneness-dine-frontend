import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BASE = process.env.REACT_APP_API_BASE_URL || '';

function useBranchId() {
  const { session } = useAuth();
  return session?.branchId || 1;
}

// ── API helpers ──────────────────────────────────────────────────────────────

const CreditLedgerService = {
  getDueCustomers: (branchId, from, to) =>
    axios.get(`${BASE}/api/credit-ledger/due-customers`, {
      params: { branchId, from, to },
    }),

  getCustomerLedger: (customerId, from, to) =>
    axios.get(`${BASE}/api/credit-ledger/customer/${customerId}`, {
      params: { from, to },
    }),

  getCustomerBalance: (customerId) =>
    axios.get(`${BASE}/api/credit-ledger/customer/${customerId}/balance`),

  collectPayment: (branchId, payload) =>
    axios.post(`${BASE}/api/credit-ledger/${branchId}/collect`, payload),
};

// ── Hooks ────────────────────────────────────────────────────────────────────

/** All customers with outstanding dues in the given date range */
export function useDueCustomers(from, to) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['credit-due-customers', branchId, from, to],
    queryFn:  () => CreditLedgerService.getDueCustomers(branchId, from, to)
                      .then(r => r.data?.data ?? []),
    enabled:  !!from && !!to,
    staleTime: 2 * 60_000,
  });
}

/** Full ledger entries for a single customer */
export function useCustomerLedger(customerId, from, to) {
  return useQuery({
    queryKey: ['credit-ledger', customerId, from, to],
    queryFn:  () => CreditLedgerService.getCustomerLedger(customerId, from, to)
                      .then(r => r.data?.data ?? []),
    enabled:  !!customerId && !!from && !!to,
    staleTime: 2 * 60_000,
  });
}

/** Current outstanding balance for a single customer */
export function useCustomerBalance(customerId) {
  return useQuery({
    queryKey: ['credit-balance', customerId],
    queryFn:  () => CreditLedgerService.getCustomerBalance(customerId)
                      .then(r => r.data?.data ?? 0),
    enabled:  !!customerId,
    staleTime: 60_000,
  });
}

/** Mutation: collect a payment against a customer's credit balance */
export function useCollectCredit() {
  const branchId    = useBranchId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ customerId, amount, remarks, collectedByUserId }) =>
      CreditLedgerService.collectPayment(branchId, {
        customerId,
        amount,
        remarks,
        collectedByUserId,
      }).then(r => r.data?.data),

    onSuccess: (_data, variables) => {
      // Invalidate all credit-related queries for this customer + branch
      queryClient.invalidateQueries({ queryKey: ['credit-due-customers', branchId] });
      queryClient.invalidateQueries({ queryKey: ['credit-ledger', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['credit-balance', variables.customerId] });
      // Also invalidate bills so BillsTab reflects new status
      queryClient.invalidateQueries({ queryKey: ['report-bills'] });
    },
  });
}
