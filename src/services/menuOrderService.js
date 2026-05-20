import apiClient from './apiClient';

export const MenuService = {
  getCategories: (branchId) =>
    apiClient.get('/menu/categories', { params: { branchId } }),
  getItems: (branchId, categoryId) =>
    apiClient.get('/menu/items', { params: { branchId, categoryId } }),
};

export const OrderService = {
  getTableOrders: (tableId) =>
    apiClient.get('/orders', { params: { tableId } }),
  getOrder: (orderId) =>
    apiClient.get(`/orders/${orderId}`),
  createOrder: (payload) =>
    apiClient.post('/orders', payload),
  addItems: (orderId, items) =>
    apiClient.post(`/orders/${orderId}/items`, items),
  updateStatus: (orderId, orderStatus, cancelReason) =>
    apiClient.patch(`/orders/${orderId}/status`, {
      orderStatus,
      ...(cancelReason ? { cancelReason } : {}),
    }),
  settleOrder: (orderId) =>
    apiClient.post(`/orders/${orderId}/settle`),
  cancelOrder: (orderId, cancelReason) =>
    apiClient.post(`/orders/${orderId}/cancel`, { orderStatus: 'CANCELLED', cancelReason }),
  removeItem: (orderId, itemId) =>
    apiClient.delete(`/orders/${orderId}/items/${itemId}`),
  getKots: (orderId) =>
    apiClient.get('/kot', { params: { orderId } }),
  createKot: (payload) =>
    apiClient.post('/kot', payload),
};

/* Bill Service — all billing API calls */
export const BillService = {
  /* GET /api/v1/bills?orderId=X — check if bill exists */
  getBillByOrder: (orderId) =>
    apiClient.get('/bills', { params: { orderId } }),
  /* POST /api/v1/bills — generate bill → orderStatus=BILLED, bill_status=DRAFT */
  generateBill: (payload) =>
    apiClient.post('/bills', payload),
  /* POST /api/v1/bills/{id}/print — physical print → bill_status=PRINTED */
  printBill: (billId) =>
    apiClient.post(`/bills/${billId}/print`),
  /* POST /api/v1/bills/{id}/pay — collect payment → isSettled=true */
  payBill: (billId, payload) =>
    apiClient.post(`/bills/${billId}/pay`, payload),
  /* POST /api/v1/bills/{id}/void — void when new items added after billing */
  voidBill: (billId) =>
    apiClient.post(`/bills/${billId}/void`),
};
