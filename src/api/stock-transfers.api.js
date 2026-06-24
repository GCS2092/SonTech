import api from './axios';

export const stockTransfersApi = {
  /** Liste tous les transferts (filtres optionnels : status, storeId) */
  getAll: (params = {}) =>
    api.get('/admin/stock-transfers', { params }),

  /** Crée un transfert (statut PENDING) */
  create: (data) =>
    api.post('/admin/stock-transfers', data),

  /** Valide un transfert PENDING → VALIDATED + mouvements de stock */
  validate: (id) =>
    api.patch(`/admin/stock-transfers/${id}/validate`),

  /** Annule un transfert PENDING */
  cancel: (id, reason) =>
    api.patch(`/admin/stock-transfers/${id}/cancel`, { reason }),
};