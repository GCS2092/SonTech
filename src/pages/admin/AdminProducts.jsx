import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import { API_URL } from '../../utils/constants';

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} FCFA`;

// ─── Composant upload image ────────────────────────────────────────────────
function ImageUploader({ images, onChange, token, variantColors = [] }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [tab, setTab] = useState('file');

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/api/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Échec upload');
    return res.json();
  };

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadFile));
      const newImages = uploaded.map((img, i) => ({
        url: img.url,
        publicId: img.publicId,
        isMain: images.length === 0 && i === 0,
        position: images.length + i,
        color: null,
      }));
      onChange([...images, ...newImages]);
    } catch {
      alert("Erreur lors de l'upload. Vérifiez le format (JPEG, PNG, WebP, AVIF) et la taille (max 5 Mo).");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };

  const addUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, { url: trimmed, publicId: '', isMain: images.length === 0, position: images.length, color: null }]);
    setUrlInput('');
  };

  const setMain = (idx) => onChange(images.map((img, i) => ({ ...img, isMain: i === idx })));

  const remove = (idx) => {
    const next = images.filter((_, i) => i !== idx).map((img, i) => ({
      ...img, isMain: i === 0, position: i,
    }));
    onChange(next);
  };

  const setColor = (idx, color) => {
    onChange(images.map((img, i) => i === idx ? { ...img, color: color || null } : img));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Images du produit</label>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button type="button" onClick={() => setTab('file')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'file' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          📁 Depuis l'appareil
        </button>
        <button type="button" onClick={() => setTab('url')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === 'url' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          🔗 Via un lien
        </button>
      </div>

      {tab === 'file' && (
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="animate-spin h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm text-gray-500">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-3xl">🖼️</div>
              <p className="text-sm font-medium text-gray-700">Cliquez ou glissez vos images ici</p>
              <p className="text-xs text-gray-400">JPEG · PNG · WebP · AVIF — max 5 Mo par image</p>
            </div>
          )}
        </div>
      )}

      {tab === 'url' && (
        <div className="flex gap-2">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            placeholder="https://exemple.com/image.jpg"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
          <button type="button" onClick={addUrl}
            className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium">
            Ajouter
          </button>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-2 mt-1">
          {images.map((img, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 border border-gray-100 rounded-xl bg-gray-50">
              {/* Miniature */}
              <div className="relative shrink-0">
                <img
                  src={img.url}
                  alt={`img-${idx}`}
                  className={`h-16 w-16 object-cover rounded-lg border-2 transition-all ${img.isMain ? 'border-black' : 'border-gray-200'}`}
                  onError={(e) => { e.target.src = ''; e.target.parentElement.style.display = 'none'; }}
                />
                {img.isMain && (
                  <span className="absolute top-0.5 left-0.5 bg-black text-white text-[9px] font-bold px-1 py-0.5 rounded-full">★</span>
                )}
              </div>

              {/* Couleur associée */}
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-gray-500 mb-1">
                  Couleur associée
                  {variantColors.length > 0 && <span className="text-gray-400 font-normal"> — cliquez pour assigner</span>}
                </label>
                {variantColors.length > 0 ? (
                  <div className="flex gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setColor(idx, null)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        !img.color ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      Toutes
                    </button>
                    {variantColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(idx, c)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          img.color === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={img.color || ''}
                    onChange={(e) => setColor(idx, e.target.value)}
                    placeholder="ex : Rouge (vide = toutes les couleurs)"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                )}
                {img.color && (
                  <p className="text-[10px] text-gray-400 mt-0.5">📎 Assignée à : <span className="font-medium text-gray-600">{img.color}</span></p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 shrink-0">
                {!img.isMain && (
                  <button type="button" onClick={() => setMain(idx)}
                    className="bg-white border border-gray-200 text-gray-600 rounded-lg w-7 h-7 flex items-center justify-center text-xs hover:bg-yellow-50 hover:border-yellow-300"
                    title="Image principale">★</button>
                )}
                <button type="button" onClick={() => remove(idx)}
                  className="bg-white border border-red-200 text-red-400 rounded-lg w-7 h-7 flex items-center justify-center text-xs hover:bg-red-50"
                  title="Supprimer">✕</button>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400">{images.length} image{images.length > 1 ? 's' : ''} — ★ pour définir la principale</p>
        </div>
      )}
    </div>
  );
}

// ─── Composant gestion variantes ───────────────────────────────────────────
function VariantsEditor({ variants, onChange }) {
  const emptyVariant = { size: '', color: '', stock: '' };
  const addVariant = () => onChange([...variants, { ...emptyVariant }]);
  const updateVariant = (idx, field, value) => {
    onChange(variants.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };
  const removeVariant = (idx) => onChange(variants.filter((_, i) => i !== idx));

  const sizeSuggestions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unique'];
  const colorSuggestions = ['Noir', 'Blanc', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Gris', 'Beige', 'Marron'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700">Variantes (taille / couleur)</label>
          <p className="text-xs text-gray-400 mt-0.5">Chaque combinaison taille + couleur a son propre stock</p>
        </div>
        <button type="button" onClick={addVariant}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors">
          <span className="text-base leading-none">+</span> Ajouter
        </button>
      </div>

      {variants.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
          Aucune variante — le produit a un stock unique.<br />
          <span className="text-xs">Cliquez "+ Ajouter" pour créer des variantes taille/couleur.</span>
        </div>
      )}

      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 px-1">
            <span className="text-xs font-medium text-gray-500">Taille</span>
            <span className="text-xs font-medium text-gray-500">Couleur</span>
            <span className="text-xs font-medium text-gray-500">Stock</span>
            <span />
          </div>

          {variants.map((v, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-start">
              <div className="space-y-1">
                <input type="text" value={v.size}
                  onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                  placeholder="ex : M"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                <div className="flex gap-1 flex-wrap">
                  {sizeSuggestions.map((s) => (
                    <button key={s} type="button" onClick={() => updateVariant(idx, 'size', s)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        v.size === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}>{s}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <input type="text" value={v.color}
                  onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                  placeholder="ex : Rouge"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
                <div className="flex gap-1 flex-wrap">
                  {colorSuggestions.map((c) => (
                    <button key={c} type="button" onClick={() => updateVariant(idx, 'color', c)}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                        v.color === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>

              <input type="number" value={v.stock}
                onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                min="0" placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />

              <button type="button" onClick={() => removeVariant(idx)}
                className="w-8 h-8 mt-0.5 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors text-xs font-bold">✕</button>
            </div>
          ))}

          <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>{variants.length} variante{variants.length > 1 ? 's' : ''}</span>
            <span className="font-medium text-gray-700">
              Stock total : {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AdminProducts() {
  const { token } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const emptyForm = {
    name: '', slug: '', description: '', price: '', comparePrice: '',
    purchasePrice: '', stock: '', categoryId: '',
    isActive: true, isFeatured: false,
    variantDisplayMode: 'SIZE_FIRST',
    images: [], variants: [],
  };
  const [form, setForm] = useState(emptyForm);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const slugify = (str) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/api/products/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/categories`),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProducts(Array.isArray(pData) ? pData : pData.data || []);
      setCategories(Array.isArray(cData) ? cData : cData.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setForm(emptyForm); setSelected(null); setFieldErrors({}); setModal('create');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      price: p.price, comparePrice: p.comparePrice || '',
      purchasePrice: p.purchasePrice || '',
      stock: p.stock, categoryId: p.categoryId || '',
      isActive: p.isActive ?? true, isFeatured: p.isFeatured ?? false,
      variantDisplayMode: p.variantDisplayMode || 'SIZE_FIRST',
      images: (p.images || []).map((img) => ({
        ...img,
        color: img.color || null,
      })),
      variants: (p.variants || []).map((v) => ({
        id: v.id, size: v.size || '', color: v.color || '', stock: v.stock ?? 0,
      })),
    });
    setSelected(p); setFieldErrors({}); setModal('edit');
  };

  const openDelete = (p) => { setSelected(p); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setFieldErrors({}); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' ? { slug: slugify(value) } : {}),
    }));
    if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Le nom est obligatoire';
    if (!form.price || Number(form.price) < 0) errors.price = 'Prix invalide';
    if (form.variants.length === 0 && (form.stock === '' || Number(form.stock) < 0)) {
      errors.stock = 'Stock invalide';
    }
    if (form.purchasePrice !== '' && Number(form.purchasePrice) < 0) errors.purchasePrice = 'Prix achat invalide';
    form.variants.forEach((v, i) => {
      if (!v.size.trim() && !v.color.trim()) errors[`variant_${i}`] = `Variante ${i + 1} : taille ou couleur requise`;
      if (v.stock === '' || Number(v.stock) < 0) errors[`variant_stock_${i}`] = `Variante ${i + 1} : stock invalide`;
    });
    return errors;
  };

  // Couleurs uniques extraites des variantes (pour l'ImageUploader)
  const variantColors = [...new Set(
    form.variants.map((v) => v.color).filter(Boolean)
  )];

  const buildBody = () => {
    const hasVariants = form.variants.length > 0;
    const totalVariantStock = hasVariants
      ? form.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
      : Number(form.stock);

    return {
      name: form.name.trim(),
      slug: form.slug.trim(),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      purchasePrice: form.purchasePrice !== '' ? Number(form.purchasePrice) : null,
      stock: totalVariantStock,
      ...(form.categoryId ? { categoryId: form.categoryId } : {}),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      variantDisplayMode: form.variantDisplayMode || 'SIZE_FIRST',
      images: form.images.map((img, i) => ({
        url: img.url,
        publicId: img.publicId || '',
        isMain: img.isMain ?? i === 0,
        position: i,
        color: img.color || null,
      })),
      variants: form.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        size: v.size.trim(),
        color: v.color.trim(),
        stock: Number(v.stock) || 0,
      })),
    };
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST', headers, body: JSON.stringify(buildBody()),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur serveur'); }
      await fetchAll(); closeModal(); showToast('Produit créé ✓');
    } catch (e) { showToast(e.message, 'error'); } finally { setSubmitting(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${selected.id}`, {
        method: 'PUT', headers, body: JSON.stringify(buildBody()),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Erreur serveur'); }
      await fetchAll(); closeModal(); showToast('Produit modifié ✓');
    } catch (e) { showToast(e.message, 'error'); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/products/${selected.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Erreur suppression');
      await fetchAll(); closeModal(); showToast('Produit supprimé');
    } catch (e) { showToast(e.message, 'error'); } finally { setSubmitting(false); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const inputClass = (field) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
      fieldErrors[field]
        ? 'border-red-400 focus:ring-red-200 bg-red-50'
        : 'border-gray-200 focus:ring-black/20 focus:border-gray-400'
    }`;

  const variantErrors = Object.entries(fieldErrors)
    .filter(([k]) => k.startsWith('variant_'))
    .map(([, v]) => v);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} produit{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <span className="text-lg leading-none">+</span> Nouveau produit
        </button>
      </div>

      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 bg-white" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error} — <button onClick={fetchAll} className="underline font-medium">Réessayer</button>
        </div>
      )}

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
            <div className="text-4xl mb-3">🛍️</div>
            <p className="font-medium">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Produit</th>
                  <th className="px-6 py-3">Catégorie</th>
                  <th className="px-6 py-3">Prix vente</th>
                  <th className="px-6 py-3">Prix achat</th>
                  <th className="px-6 py-3">Stock réel</th>
                  <th className="px-6 py-3">Réservé</th>
                  <th className="px-6 py-3">Disponible</th>
                  <th className="px-6 py-3">Variantes</th>
                  <th className="px-6 py-3">Affichage</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const mainImage = p.images?.find(i => i.isMain)?.url || p.images?.[0]?.url;
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {mainImage ? (
                            <img src={mainImage} alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">N/A</div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cat?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{formatPrice(p.price)}</div>
                        {p.comparePrice && <div className="text-xs text-gray-400 line-through">{formatPrice(p.comparePrice)}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {p.purchasePrice
                          ? <span className="text-gray-700">{formatPrice(p.purchasePrice)}</span>
                          : <span className="text-gray-300 text-xs italic">Non défini</span>}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{p.stock ?? 0}</td>
                      <td className="px-6 py-4 text-amber-700">{p.reservedStock ?? 0}</td>
                      <td className="px-6 py-4">
                        {(() => {
                          const available = (p.stock ?? 0) - (p.reservedStock ?? 0);
                          return (
                            <span className={`font-semibold ${available <= 5 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {available}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {p.variants?.length > 0
                          ? <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{p.variants.length} variante{p.variants.length > 1 ? 's' : ''}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {p.variants?.length > 0 ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.variantDisplayMode === 'COLOR_FIRST'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {p.variantDisplayMode === 'COLOR_FIRST' ? '🎨 Couleur' : '📐 Taille'}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-fit ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          {p.isFeatured && <span className="px-2 py-0.5 rounded-full text-xs font-medium w-fit bg-amber-100 text-amber-700">Vedette</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)}
                            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium">Modifier</button>
                          <button onClick={() => openDelete(p)}
                            className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Créer / Modifier ── */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'create' ? 'Nouveau produit' : 'Modifier le produit'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {Object.keys(fieldErrors).length > 0 && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm font-medium text-red-700 mb-1">Corrigez les erreurs suivantes :</p>
                <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                  {Object.values(fieldErrors).map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}

            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="p-6 space-y-4">

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Robe Wax Élégante" className={inputClass('name')} />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input name="slug" value={form.slug} onChange={handleChange}
                  placeholder="robe-wax-elegante" className={`${inputClass('slug')} font-mono`} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 text-xs font-normal">(optionnelle)</span>
                </label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  rows={3} placeholder="Description du produit..." className={inputClass('description')} />
              </div>

              {/* Prix vente + Prix barré */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix vente (FCFA) <span className="text-red-500">*</span>
                  </label>
                  <input type="number" name="price" value={form.price} onChange={handleChange}
                    min="0" placeholder="25000" className={inputClass('price')} />
                  {fieldErrors.price && <p className="text-xs text-red-500 mt-1">{fieldErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix barré (FCFA)</label>
                  <input type="number" name="comparePrice" value={form.comparePrice} onChange={handleChange}
                    min="0" placeholder="35000" className={inputClass('comparePrice')} />
                </div>
              </div>

              {/* Prix achat */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 space-y-1">
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  💰 Prix d'achat (FCFA) <span className="text-amber-500 text-xs font-normal">(optionnel — utilisé pour les marges)</span>
                </label>
                <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange}
                  min="0" placeholder="ex : 15000"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                    fieldErrors.purchasePrice
                      ? 'border-red-400 focus:ring-red-200 bg-red-50'
                      : 'border-amber-200 focus:ring-amber-300 bg-white'
                  }`} />
                {fieldErrors.purchasePrice && <p className="text-xs text-red-500 mt-1">{fieldErrors.purchasePrice}</p>}
                {form.price && form.purchasePrice && Number(form.purchasePrice) > 0 && (
                  <p className="text-xs text-amber-700 mt-1">
                    Marge estimée :{' '}
                    <span className="font-semibold">{formatPrice(Number(form.price) - Number(form.purchasePrice))}</span>{' '}
                    ({Math.round(((Number(form.price) - Number(form.purchasePrice)) / Number(form.price)) * 100)}%)
                  </p>
                )}
              </div>

              {/* Stock global — masqué si variantes */}
              {form.variants.length === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input type="number" name="stock" value={form.stock} onChange={handleChange}
                      min="0" placeholder="20" className={inputClass('stock')} />
                    {fieldErrors.stock && <p className="text-xs text-red-500 mt-1">{fieldErrors.stock}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass('categoryId')}>
                      <option value="">— Aucune —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Catégorie seule si variantes */}
              {form.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select name="categoryId" value={form.categoryId} onChange={handleChange} className={inputClass('categoryId')}>
                    <option value="">— Aucune —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Variantes */}
              <div className="border-t border-gray-100 pt-4">
                <VariantsEditor
                  variants={form.variants}
                  onChange={(variants) => setForm(prev => ({ ...prev, variants }))}
                />
                {variantErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {variantErrors.map((msg, i) => <p key={i} className="text-xs text-red-500">{msg}</p>)}
                  </div>
                )}
              </div>

              {/* Mode d'affichage — visible seulement si variantes */}
              {form.variants.length > 0 && (
                <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700">
                    🎨 Mode d'affichage des variantes
                  </label>
                  <p className="text-xs text-gray-400">Définit ce que le client choisit en premier côté boutique</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, variantDisplayMode: 'SIZE_FIRST' }))}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        (form.variantDisplayMode || 'SIZE_FIRST') === 'SIZE_FIRST'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                      }`}
                    >
                      📐 Taille d'abord
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, variantDisplayMode: 'COLOR_FIRST' }))}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        form.variantDisplayMode === 'COLOR_FIRST'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400 bg-white'
                      }`}
                    >
                      🎨 Couleur d'abord
                    </button>
                  </div>
                </div>
              )}

              {/* Upload images */}
              <div className="border-t border-gray-100 pt-4">
                <ImageUploader
                  images={form.images}
                  onChange={(imgs) => setForm(prev => ({ ...prev, images: imgs }))}
                  token={token}
                  variantColors={variantColors}
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between py-1">
                <label className="text-sm font-medium text-gray-700">Produit actif</label>
                <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <label className="text-sm font-medium text-gray-700">Produit en vedette</label>
                <button type="button" onClick={() => setForm(p => ({ ...p, isFeatured: !p.isFeatured }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isFeatured ? 'bg-amber-400' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60">
                  {submitting ? 'En cours...' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Supprimer ── */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Supprimer le produit ?</h2>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">"{selected.name}"</span> sera supprimé définitivement.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleDelete} disabled={submitting}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}