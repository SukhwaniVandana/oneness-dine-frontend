import apiClient from './apiClient';

/* ─────────────────────────────────────────────────────
   KOT Service
───────────────────────────────────────────────────── */
const KotService = {

  /* GET /api/v1/kot?branchId=1&status=PENDING
     status optional: PENDING | PREPARING | READY | SERVED */
  getKots: (branchId, status = null) =>
    apiClient.get('/kot', {
      params: {
        branchId,
        ...(status ? { status } : {}),
      },
    }),

  /* PATCH /api/v1/kot/{id}/status — update full KOT status */
  updateKotStatus: (kotId, displayStatus) =>
    apiClient.patch(`/kot/${kotId}/status`, { displayStatus }),

  /* PATCH /api/v1/kot/{id}/items/{itemId}/status — update single item */
  updateKotItemStatus: (kotId, itemId, displayStatus) =>
    apiClient.patch(`/kot/${kotId}/items/${itemId}/status`, { displayStatus }),
};

export default KotService;
