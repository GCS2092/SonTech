import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const STAFF_ROLES = ['MANAGER', 'ACCOUNTANT', 'COMMERCIAL', 'WAREHOUSE', 'DELIVERY'];

export default function AdminUsers() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modal d'assignation
  const [assignUser, setAssignUser] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedRole, setSelectedRole] = useState('MANAGER');
  const [assigning, setAssigning] = useState(false);
const [newPassword, setNewPassword] = useState('');
const [resettingPwd, setResettingPwd] = useState(false);
  // Modal création staff
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    phone: '', storeId: '', storeRole: 'MANAGER',
  });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/users/admin/all`, { headers });
      if (!res.ok) throw new Error('Erreur chargement utilisateurs');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
const handleResetPassword = async () => {
  if (!newPassword || newPassword.length < 6) {
    toast.error('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }
  setResettingPwd(true);
  try {
    const res = await fetch(`${API_URL}/api/users/admin/${assignUser.id}/password`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur');
    toast.success('Mot de passe mis à jour');
    setNewPassword('');
  } catch (e) {
    toast.error(e.message);
  } finally {
    setResettingPwd(false);
  }
};
  const fetchStores = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stores`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setStores(Array.isArray(data) ? data : data.data || []);
    } catch {
      // silencieux
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStores();
  }, []);

  const filtered = users.filter((u) => {
    const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const getInitials = (u) =>
    `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || '?';

  // ── Gestion de l'assignation ──────────────────────────────────────
  const openAssignModal = async (user) => {
    setAssignUser(user);
    setSelectedStoreId('');
    setSelectedRole('MANAGER');
    try {
      const res = await fetch(`${API_URL}/api/admin/stores/user/${user.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setUserStores(data);
      } else {
        setUserStores([]);
      }
    } catch {
      setUserStores([]);
    }
  };

  const closeAssignModal = () => {
    setAssignUser(null);
    setUserStores([]);
  };

  const handleAssign = async () => {
    if (!selectedStoreId) {
      toast.error('Sélectionne une boutique');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stores/assign-user`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assignUser.id,
          storeId: selectedStoreId,
          role: selectedRole,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'assignation');
      toast.success('Boutique assignée');
      openAssignModal(assignUser);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (storeId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stores/remove-user`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignUser.id, storeId }),
      });
      if (!res.ok) throw new Error('Erreur lors du retrait');
      toast.success('Retiré de la boutique');
      openAssignModal(assignUser);
    } catch (e) {
      toast.error(e.message);
    }
  };

  // ── Création d'un membre staff ─────────────────────────────────────
  const handleCreateStaff = async () => {
    const { firstName, lastName, email, password } = createForm;
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Prénom, nom, email et mot de passe sont requis');
      return;
    }
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/users/admin/staff`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la création');
      toast.success('Compte staff créé');
      setShowCreateForm(false);
      setCreateForm({ firstName: '', lastName: '', email: '', password: '', phone: '', storeId: '', storeRole: 'MANAGER' });
      fetchUsers();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            + Nouveau membre staff
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            ↻ Actualiser
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white"
        />
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error} —{' '}
          <button onClick={fetchUsers} className="underline font-medium">
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 sm:px-6 py-3">Utilisateur</th>
                  <th className="px-4 sm:px-6 py-3 hidden sm:table-cell">Rôle</th>
                  <th className="px-4 sm:px-6 py-3 hidden md:table-cell">Téléphone</th>
                  <th className="px-4 sm:px-6 py-3 hidden md:table-cell">Commandes</th>
                  <th className="px-4 sm:px-6 py-3 hidden lg:table-cell">Inscrit le</th>
                  <th className="px-4 sm:px-6 py-3">Boutiques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(u)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          <span className={`sm:hidden inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role || 'CUSTOMER'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600 hidden md:table-cell">
                      {u.phone || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600 hidden md:table-cell">
                      {u._count?.orders ?? 0}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-gray-600 hidden lg:table-cell">
                      {u.createdAt ? formatDate(u.createdAt) : '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => openAssignModal(u)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Gérer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d'assignation */}
      {assignUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                Boutiques de {assignUser.firstName} {assignUser.lastName}
              </h2>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-2 mb-4">
              {userStores.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune boutique assignée (accès global si ADMIN).</p>
              ) : (
                userStores.map((link) => (
                  <div key={link.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{link.store.name}</span>
                      <span className="text-gray-400 ml-2">{link.store.code}</span>
                      {link.store.isMain && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Siège</span>
                      )}
                      <div className="text-xs text-gray-400">{link.role}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(link.storeId)}
                      className="text-red-500 text-xs font-medium hover:underline"
                    >
                      Retirer
                    </button>
                  </div>
                ))
              )}
            </div>
{/* Réinitialiser le mot de passe */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
              <label className="text-xs font-medium text-gray-500 block">Nouveau mot de passe</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleResetPassword}
                  disabled={resettingPwd}
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {resettingPwd ? '...' : 'Réinitialiser'}
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Ajouter à une boutique</label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Choisir une boutique —</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}){s.isMain ? ' — Siège' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Rôle dans la boutique</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {assigning ? 'Ajout...' : 'Assigner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création staff */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Nouveau membre staff</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Prénom</label>
                  <input
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Nom</label>
                  <input
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Mot de passe</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Min. 6 caractères"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Téléphone (optionnel)</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs font-medium text-gray-500 block mb-1">Boutique assignée</label>
                <select
                  value={createForm.storeId}
                  onChange={(e) => setCreateForm({ ...createForm, storeId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Aucune (compte client) —</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}){s.isMain ? ' — Siège' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {createForm.storeId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Rôle dans la boutique</label>
                  <select
                    value={createForm.storeRole}
                    onChange={(e) => setCreateForm({ ...createForm, storeRole: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCreateStaff}
                disabled={creating}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
              >
                {creating ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}