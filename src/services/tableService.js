import apiClient from './apiClient';

/* ─────────────────────────────────────────────────────
   Table Service — mapped to ONENESS Dine backend
───────────────────────────────────────────────────── */
const TableService = {

  /* GET /api/v1/tables/dashboard?branchId=1
     Returns TableDashboardDto[] with activeOrders[] per table
     USE THIS instead of /tables for the dashboard — richer data */
  getDashboard: (branchId) =>
    apiClient.get('/tables/dashboard', { params: { branchId } }),

  /* GET /api/v1/tables?branchId=1 */
  getAllTables: (branchId) =>
    apiClient.get('/tables', { params: { branchId } }),

  /* GET /api/v1/tables/{id} */
  getTableById: (tableId) =>
    apiClient.get(`/tables/${tableId}`),

  /* PUT /api/v1/tables/{id}/lock — lock table */
  lockTable: (tableId) =>
    apiClient.post(`/tables/${tableId}/lock`),

  /* DELETE /api/v1/tables/{id}/lock — unlock table */
  unlockTable: (tableId) =>
    apiClient.delete(`/tables/${tableId}/lock`),
};

export default TableService;
