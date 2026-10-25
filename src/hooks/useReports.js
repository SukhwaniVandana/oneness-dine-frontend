import { useQuery } from '@tanstack/react-query';
import ReportService from '../services/reportService';
import { useAuth } from '../context/AuthContext';

function useBranchId() {
  const { session } = useAuth();
  return session?.branchId || 1;
}

/* Today's date as YYYY-MM-DD */
export function today() {
  return new Date().toISOString().split('T')[0];
}

export function useDaily(date) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['report-daily', branchId, date],
    queryFn:  () => ReportService.getDaily(branchId, date).then(r => r.data?.data),
    enabled:  !!date,
    staleTime: 5 * 60_000,
  });
}

export function useSales(from, to, enabled = true) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['report-sales', branchId, from, to],
    queryFn:  () => ReportService.getSales(branchId, from, to).then(r => r.data?.data),
    enabled:  !!from && !!to && enabled, // waits until daily is done
    staleTime: 5 * 60_000,
  });
}

export function usePayments(from, to) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['report-payments', branchId, from, to],
    queryFn:  () => ReportService.getPayments(branchId, from, to).then(r => r.data?.data),
    enabled:  !!from && !!to,
    staleTime: 5 * 60_000,
  });
}

export function useItems(from, to) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['report-items', branchId, from, to],
    queryFn:  () => ReportService.getItems(branchId, from, to).then(r => r.data?.data ?? []),
    enabled:  !!from && !!to,
    staleTime: 5 * 60_000,
  });
}

export function useBills(from, to) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['report-bills', branchId, from, to],
    queryFn:  () => ReportService.getBills(branchId, from, to).then(r => r.data?.data ?? []),
    enabled:  !!from && !!to,
    staleTime: 5 * 60_000,
  });
}
