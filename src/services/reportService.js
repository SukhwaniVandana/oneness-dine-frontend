import apiClient from './apiClient';

const ReportService = {
  /* Daily summary — single date */
  getDaily: (branchId, date) =>
    apiClient.get('/reports/daily', { params: { branchId, date } }),

  /* Sales report — date range */
  getSales: (branchId, from, to) =>
    apiClient.get('/reports/sales', { params: { branchId, from, to } }),

  /* Payment mode breakdown — single date */
  getPayments: (branchId, date) =>
    apiClient.get('/reports/payments', { params: { branchId, date } }),

  /* Top selling items — date range */
  getItems: (branchId, from, to) =>
    apiClient.get('/reports/items', { params: { branchId, from, to } }),

  /* Bills list — use existing bills endpoint */
  getBills: (branchId, from, to) =>
    apiClient.get('/bills', { params: { branchId, from, to } }),
};

export default ReportService;
