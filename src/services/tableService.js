import apiClient from './apiClient';

/* ─────────────────────────────────────────────
   Table Service
   Maps to: /api/tables  (TableController.java)
   Endpoints from your ONENESS Dine backend
───────────────────────────────────────────── */

const TableService = {

  /* GET /api/tables — all tables for a branch */
  getAllTables: (branchId) =>
    apiClient.get('/tables', { params: { branchId } }),

  /* GET /api/tables/{id} — single table details */
  getTableById: (tableId) =>
    apiClient.get(`/tables/${tableId}`),

  /* GET /api/tables/active-sessions — occupied tables with session info */
  getActiveSessions: (branchId) =>
    apiClient.get('/tables/active-sessions', { params: { branchId } }),

  /* POST /api/tables/{id}/open-session — open table, start timer */
  openSession: (tableId, payload) =>
    apiClient.post(`/tables/${tableId}/open-session`, payload),

  /* POST /api/tables/{id}/close-session — close after billing */
  closeSession: (tableId) =>
    apiClient.post(`/tables/${tableId}/close-session`),

  /* PUT /api/tables/{id}/status — update status (FREE/OCCUPIED/RESERVED/BILLING) */
  updateStatus: (tableId, status) =>
    apiClient.put(`/tables/${tableId}/status`, { status }),

  /* GET /api/tables — count by status for dashboard header */
  getSummary: (branchId) =>
    apiClient.get('/tables', { params: { branchId } }),
};

export default TableService;
