import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuService, OrderService, BillService } from '../services/menuOrderService';
import { useAuth } from '../context/AuthContext';

export function useMenuCategories() {
  const { session } = useAuth();
  const branchId = session?.branchId || 1;
  return useQuery({
    queryKey: ['menu-categories', branchId],
    queryFn: () => MenuService.getCategories(branchId).then(r => r.data?.data ?? []),
    staleTime: 5 * 60_000,
    retry: 2,
  });
}

export function useMenuItems(categoryId) {
  const { session } = useAuth();
  const branchId = session?.branchId || 1;
  return useQuery({
    queryKey: ['menu-items', branchId, categoryId],
    queryFn: () => MenuService.getItems(branchId, categoryId).then(r => r.data?.data ?? []),
    enabled: !!categoryId,
    staleTime: 5 * 60_000,
    retry: 2,
  });
}

export function useTableOrders(tableId) {
  return useQuery({
    queryKey: ['table-orders', tableId],
    queryFn: () => OrderService.getTableOrders(tableId).then(r => r.data?.data ?? []),
    enabled: !!tableId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => OrderService.createOrder(payload).then(r => r.data?.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useAddItems() {
  return useMutation({
    mutationFn: ({ orderId, items }) =>
      OrderService.addItems(orderId, items).then(r => r.data?.data),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, orderStatus, cancelReason }) =>
      OrderService.updateStatus(orderId, orderStatus, cancelReason).then(r => r.data?.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function useCreateKot() {
  return useMutation({
    mutationFn: (payload) => OrderService.createKot(payload).then(r => r.data?.data),
  });
}

export function useRemoveOrderItem() {
  return useMutation({
    mutationFn: ({ orderId, itemId }) =>
      OrderService.removeItem(orderId, itemId).then(r => r.data?.data),
  });
}

export function useSettleOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => OrderService.settleOrder(orderId).then(r => r.data?.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

/* Bill mutations */
export function useGenerateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => BillService.generateBill(payload).then(r => r.data?.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] }),
  });
}

export function usePrintBill() {
  return useMutation({
    mutationFn: (billId) => BillService.printBill(billId).then(r => r.data?.data),
  });
}

export function useVoidBill() {
  return useMutation({
    mutationFn: (billId) => BillService.voidBill(billId).then(r => r.data?.data),
  });
}
