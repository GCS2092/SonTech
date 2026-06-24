// frontend/src/api/accounting.api.js
import api from './axios';

export const accountingApi = {
  // ── Dashboard ─────────────────────────────────────────────
  getDashboard: (params) =>
    api.get('/api/admin/accounting/dashboard', { params }),

  // ── Mouvements de stock ───────────────────────────────────
  getStockMovements: (params) =>
    api.get('/api/admin/accounting/stock-movements', { params }),
  createStockMovement: (data) =>
    api.post('/api/admin/accounting/stock-movements', data),
  cancelStockMovement: (id) =>
    api.post(`/api/admin/accounting/stock-movements/${id}/cancel`),

  // ── Dépenses ──────────────────────────────────────────────
  getExpenses: (params) =>
    api.get('/api/admin/accounting/expenses', { params }),
  createExpense: (data) =>
    api.post('/api/admin/accounting/expenses', data),
  updateExpense: (id, data) =>
    api.put(`/api/admin/accounting/expenses/${id}`, data),
  deleteExpense: (id) =>
    api.delete(`/api/admin/accounting/expenses/${id}`),

  // ── Fournisseurs ──────────────────────────────────────────
  // Tous les fournisseurs (actifs + inactifs) — pour la page gestion
  getAllSuppliers: () =>
    api.get('/api/admin/accounting/suppliers/all'),
  // Fournisseurs actifs uniquement — pour les selects dans les modals
  getSuppliers: () =>
    api.get('/api/admin/accounting/suppliers'),
  createSupplier: (data) =>
    api.post('/api/admin/accounting/suppliers', data),
  updateSupplier: (id, data) =>
    api.put(`/api/admin/accounting/suppliers/${id}`, data),
  toggleSupplier: (id) =>
    api.patch(`/api/admin/accounting/suppliers/${id}/toggle`),

  // ── Marges produits ───────────────────────────────────────
  getProductMargins: () =>
    api.get('/api/admin/accounting/product-margins'),

  // ── Produits (pour le select dans modal mouvement stock) ──
  // ✅ Route admin dédiée — retourne tous les produits (actifs + inactifs)
  getAdminProducts: () =>
    api.get('/api/products/admin/all', { params: { limit: 200 } }),
};