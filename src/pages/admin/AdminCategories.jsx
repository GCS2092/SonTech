import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminCategories() {
  const { token } = useAuthStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', imageUrl: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/categories`);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Open create modal
  const openCreate = () => {
    setForm({ name: '', slug: '', imageUrl: '', isActive: true });
    setSelected(null);
    setModal('create');
  };

  // Open edit modal
  const openEdit = (cat) => {
    setForm({ name: cat.name, slug: cat.slug, imageUrl: cat.imageUrl || '', isActive: cat.isActive ?? true });
    setSelected(cat);
    setModal('edit');
  };

  // Open delete modal
  const openDelete = (cat) => {
    setSelected(cat);
    setModal('delete');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' ? { slug: slugify(value) } : {}),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur création');
      }
      await fetchCategories();
      closeModal();
      showToast('Catégorie créée avec succès');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/categories/${selected.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erreur modification');
      }
      await fetchCategories();
      closeModal();
      showToast('Catégorie modifiée avec succès');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/categories/${selected.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Erreur suppression');
      await fetchCategories();
      closeModal();
      showToast('Catégorie supprimée');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all
            ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} catégorie{categories.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Nouvelle catégorie
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error} — <button onClick={fetchCategories} className="underline font-medium">Réessayer</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="font-medium">Aucune catégorie</p>
            <p className="text-sm mt-1">Commencez par en créer une</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">Image</th>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.name} className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4">
                    <span className={`bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono`}>{cat.slug}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => openDelete(cat)}
                        className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Create / Edit */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'create' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: Robes Africaines"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: robes-africaines"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition"
                />
                <p className="text-xs text-gray-400 mt-1">Généré automatiquement depuis le nom</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'image</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition"
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 h-16 w-16 rounded-lg object-cover border border-gray-200" onError={(e) => e.target.style.display = 'none'} />
                )}
              </div>
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Catégorie active</label>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  {submitting ? 'En cours...' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Supprimer la catégorie ?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Vous êtes sur le point de supprimer <span className="font-medium text-gray-700">"{selected.name}"</span>. Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}