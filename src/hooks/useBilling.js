import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BillService } from '../services/menuOrderService';
import { useAuth } from '../context/AuthContext';

/* ── Fetch bill by orderId ── */
export function useBill(orderId) {
  return useQuery({
    queryKey: ['bill', orderId],
    queryFn: () =>
      BillService.getBillByOrder(orderId).then(r => r.data?.data ?? null),
    enabled: !!orderId,
    staleTime: 0,
    retry: false, // 404 means no bill yet — don't retry
  });
}

/* ── Generate bill ── */
export function useGenerateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      BillService.generateBill(payload).then(r => r.data?.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill', data?.orderId] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

/* ── Pay bill ── */
export function usePayBill() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, payments }) =>
      BillService.payBill(billId, {
        payments,
        createdByUserId: session?.userId,
      }).then(r => r.data?.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-orders'] });
    },
  });
}

/* ── Apply discount — sends discountPct (percentage) to backend ── */
export function useApplyDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, discountPct, discountReason }) =>
      BillService.applyDiscount(billId, { discountPct, discountReason })
        .then(r => r.data?.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bill', data?.orderId] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}
