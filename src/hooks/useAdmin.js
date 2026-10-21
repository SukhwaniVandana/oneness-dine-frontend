import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CategoryService, MenuAdminService, TaxGroupService,
  SectionService, TableAdminService, SettingsService,
} from '../services/adminService';
import { useAuth } from '../context/AuthContext';

function useBranchId() {
  const { session } = useAuth();
  return session?.branchId || 1;
}

/* ── Categories ── */
export function useCategories() {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-categories', branchId],
    queryFn:  () => CategoryService.getAll(branchId).then(r => r.data?.data ?? []),
    staleTime: 30_000,
  });
}
export function useCategoryMutations() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admin-categories', branchId] });
  return {
    create: useMutation({ mutationFn: (data) => CategoryService.create({ ...data, branchId }).then(r => r.data?.data), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, data }) => CategoryService.update(id, data).then(r => r.data?.data), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id) => CategoryService.delete(id), onSuccess: inv }),
  };
}

/* ── Menu Items ── */
export function useMenuItems(categoryId) {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-items', branchId, categoryId],
    queryFn:  () => MenuAdminService.getAll(branchId, categoryId).then(r => r.data?.data ?? []),
    enabled:  !!categoryId,
    staleTime: 30_000,
  });
}
export function useMenuItemMutations() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admin-items', branchId] });
  return {
    create:           useMutation({ mutationFn: (data) => MenuAdminService.create({ ...data, branchId }).then(r => r.data?.data), onSuccess: inv }),
    update:           useMutation({ mutationFn: ({ id, data }) => MenuAdminService.update(id, data).then(r => r.data?.data), onSuccess: inv }),
    remove:           useMutation({ mutationFn: (id) => MenuAdminService.delete(id), onSuccess: inv }),
    toggleAvailability: useMutation({ mutationFn: ({ id, isAvailable }) => MenuAdminService.toggleAvailability(id, isAvailable).then(r => r.data?.data), onSuccess: inv }),
  };
}

/* ── Tax Groups ── */
export function useTaxGroups() {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-tax-groups', branchId],
    queryFn:  () => TaxGroupService.getAll(branchId).then(r => r.data?.data ?? []),
    staleTime: 60_000,
  });
}
export function useTaxGroupMutations() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admin-tax-groups', branchId] });
  return {
    create: useMutation({ mutationFn: (data) => TaxGroupService.create({ ...data, branchId }).then(r => r.data?.data), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id) => TaxGroupService.delete(id), onSuccess: inv }),
    setDefault: useMutation({ mutationFn: (id) => TaxGroupService.setDefault(id, branchId).then(r => r.data?.data), onSuccess: inv }),
  };
}

/* ── Sections ── */
export function useSections() {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-sections', branchId],
    queryFn:  () => SectionService.getAll(branchId).then(r => r.data?.data ?? []),
    staleTime: 30_000,
  });
}
export function useSectionMutations() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admin-sections', branchId] });
  return {
    create: useMutation({ mutationFn: (data) => SectionService.create({ ...data, branchId }).then(r => r.data?.data), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, data }) => SectionService.update(id, data).then(r => r.data?.data), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id) => SectionService.delete(id), onSuccess: inv }),
  };
}

/* ── Tables ── */
export function useAdminTables() {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-tables', branchId],
    queryFn:  () => TableAdminService.getAll(branchId).then(r => r.data?.data ?? []),
    staleTime: 30_000,
  });
}
export function useTableMutations() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['admin-tables', branchId] });
  return {
    create: useMutation({ mutationFn: (data) => TableAdminService.create({ ...data, branchId }).then(r => r.data?.data), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, data }) => TableAdminService.update(id, data).then(r => r.data?.data), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id) => TableAdminService.delete(id), onSuccess: inv }),
  };
}

/* ── Branch Settings ── */
export function useSettings() {
  const branchId = useBranchId();
  return useQuery({
    queryKey: ['admin-settings', branchId],
    queryFn:  () => SettingsService.get(branchId).then(r => r.data?.data),
    staleTime: 60_000,
  });
}
export function useSettingsMutation() {
  const branchId = useBranchId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => SettingsService.update(branchId, data).then(r => r.data?.data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-settings', branchId] }),
  });
}
