'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'

export default function Catalogue() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<number | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatEmoji, setNewCatEmoji] = useState('🛒')
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatEmoji, setEditCatEmoji] = useState('')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: cats }, { data: itms }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('items').select('*, category:categories(*)').order('name'),
    ])
    setCategories(cats ?? [])
    setItems(itms ?? [])
    setLoading(false)
  }

  async function addItem() {
    if (!newItemName.trim()) return
    const { data } = await supabase
      .from('items')
      .insert({ name: newItemName.trim(), category_id: newItemCategory, needed: false })
      .select('*, category:categories(*)')
      .single()
    if (data) setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewItemName('')
    setNewItemCategory(null)
    setShowAddItem(false)
  }

  async function deleteItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('items').delete().eq('id', id)
  }

  async function addCategory() {
    if (!newCatName.trim()) return
    const { data } = await supabase
      .from('categories')
      .insert({ name: newCatName.trim(), emoji: newCatEmoji })
      .select()
      .single()
    if (data) setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewCatName('')
    setNewCatEmoji('🛒')
    setShowAddCategory(false)
  }

  async function deleteCategory(id: number) {
    const hasItems = items.some(i => i.category_id === id)
    if (hasItems) { alert('Supprimez d\'abord les articles de cette catégorie.'); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    await supabase.from('categories').delete().eq('id', id)
  }

  function openEditCat(cat: Category) {
    setEditCat(cat)
    setEditCatName(cat.name)
    setEditCatEmoji(cat.emoji)
  }

  async function saveCategory() {
    if (!editCat || !editCatName.trim()) return
    const { data } = await supabase.from('categories').update({ name: editCatName.trim(), emoji: editCatEmoji }).eq('id', editCat.id).select().single()
    if (data) setCategories(prev => prev.map(c => c.id === data.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)))
    setEditCat(null)
  }

  function handleSaved(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i))
    setEditItem(null)
  }

  const byCategory = categories.map(cat => ({
    category: cat,
    items: items.filter(i => i.category_id === cat.id),
  }))
  const uncategorized = items.filter(i => !i.category_id)

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-2xl text-gray-400">Chargement...</div></div>

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-slate-100 pt-4 pb-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Catalogue</h1>
          <div className="flex gap-2">
            <button onClick={() => { document.cookie = 'app-auth=; path=/; max-age=0'; window.location.href = '/login' }} className="text-sm bg-gray-100 text-gray-400 px-3 py-2 rounded-xl font-medium">
              🔒
            </button>
            <button onClick={() => setShowAddCategory(true)} className="text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium">
              + Catégorie
            </button>
            <button onClick={() => setShowAddItem(true)} className="text-sm bg-blue-500 text-white px-3 py-2 rounded-xl font-medium">
              + Article
            </button>
          </div>
        </div>
      </div>

      {/* Modal ajout article */}
      {showAddItem && (
        <Modal title="Nouvel article" onClose={() => setShowAddItem(false)}>
          <input autoFocus type="text" placeholder="Nom de l'article" value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg mb-3 outline-none focus:border-blue-400"
          />
          <select value={newItemCategory ?? ''} onChange={e => setNewItemCategory(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Sans catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
          </select>
          <button onClick={addItem} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-lg">Ajouter</button>
        </Modal>
      )}

      {/* Modal ajout catégorie */}
      {showAddCategory && (
        <Modal title="Nouvelle catégorie" onClose={() => setShowAddCategory(false)}>
          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="Emoji" value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)}
              className="w-16 border border-gray-200 rounded-xl px-3 py-3 text-2xl text-center outline-none focus:border-blue-400"
            />
            <input autoFocus type="text" placeholder="Nom de la catégorie" value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-400"
            />
          </div>
          <button onClick={addCategory} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-lg">Ajouter</button>
        </Modal>
      )}

      {/* Modal édition catégorie */}
      {editCat && (
        <Modal title="Modifier la catégorie" onClose={() => setEditCat(null)}>
          <div className="flex gap-2 mb-3">
            <input type="text" placeholder="Emoji" value={editCatEmoji} onChange={e => setEditCatEmoji(e.target.value)}
              className="w-16 border border-gray-200 rounded-xl px-3 py-3 text-2xl text-center outline-none focus:border-blue-400"
            />
            <input autoFocus type="text" placeholder="Nom" value={editCatName} onChange={e => setEditCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveCategory()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-400"
            />
          </div>
          <button onClick={saveCategory} className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-lg">Enregistrer</button>
        </Modal>
      )}

      {/* Modal édition article */}
      {editItem && (
        <EditModal item={editItem} categories={categories} onClose={() => setEditItem(null)} onSaved={handleSaved} />
      )}

      {/* Contenu */}
      <div className="mt-3 space-y-5">
        {byCategory.map(({ category, items: catItems }) => (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">{category.emoji} {category.name}</h2>
              <div className="flex gap-3">
                <button onClick={() => openEditCat(category)} className="text-blue-300 text-xs hover:text-blue-500">✏️</button>
                <button onClick={() => deleteCategory(category.id)} className="text-red-300 text-xs hover:text-red-500">Supprimer</button>
              </div>
            </div>
            <div className="space-y-2">
              {catItems.map(item => (
                <CatalogueRow key={item.id} item={item} onDelete={deleteItem} onEdit={setEditItem} />
              ))}
              {catItems.length === 0 && <p className="text-sm text-gray-300 px-4 py-2">Aucun article</p>}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Sans catégorie</h2>
            <div className="space-y-2">
              {uncategorized.map(item => <CatalogueRow key={item.id} item={item} onDelete={deleteItem} onEdit={setEditItem} />)}
            </div>
          </div>
        )}
        {items.length === 0 && categories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">📝</div>
            <p className="text-lg">Catalogue vide</p>
            <p className="text-sm mt-1">Commence par créer une catégorie puis des articles</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CatalogueRow({ item, onDelete, onEdit }: { item: Item; onDelete: (id: number) => void; onEdit: (i: Item) => void }) {
  return (
    <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm gap-3">
      {item.photo_url ? (
        <img src={item.photo_url} alt={item.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-gray-800 font-medium">{item.name}</p>
        {item.price != null && <p className="text-xs text-blue-500 font-semibold">{item.price.toFixed(2)} €</p>}
      </div>
      <button onClick={() => onEdit(item)} className="text-blue-400 hover:text-blue-600 text-lg p-1">✏️</button>
      <button onClick={() => onDelete(item.id)} className="text-red-300 hover:text-red-500 text-xl p-1">×</button>
    </div>
  )
}

function EditModal({ item, categories, onClose, onSaved }: {
  item: Item; categories: Category[]; onClose: () => void; onSaved: (i: Item) => void
}) {
  const [name, setName] = useState(item.name)
  const [categoryId, setCategoryId] = useState<number | null>(item.category_id ?? null)
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '')
  const [photoUrl, setPhotoUrl] = useState(item.photo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `items/${item.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('item-photos').upload(path, file, { upsert: true, contentType: file.type })
    if (!error) {
      const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
      const newUrl = data.publicUrl
      setPhotoUrl(newUrl)
      // Auto-sauvegarde immédiate après la photo
      const updates = {
        name: name.trim(),
        category_id: categoryId,
        price: price !== '' ? parseFloat(price) : null,
        photo_url: newUrl,
      }
      const { data: saved } = await supabase.from('items').update(updates).eq('id', item.id).select('*, category:categories(*)').single()
      if (saved) onSaved(saved)
    } else {
      alert('Erreur upload : ' + error.message)
    }
    setUploading(false)
  }

  async function save() {
    const updates = {
      name: name.trim(),
      category_id: categoryId,
      price: price !== '' ? parseFloat(price) : null,
      photo_url: photoUrl || null,
    }
    const { data } = await supabase.from('items').update(updates).eq('id', item.id).select('*, category:categories(*)').single()
    if (data) onSaved(data)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Modifier l&apos;article</h3>

        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nom</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 mt-1 outline-none focus:border-blue-400"
        />

        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Catégorie</label>
        <select value={categoryId ?? ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 mt-1 outline-none focus:border-blue-400 bg-white"
        >
          <option value="">Sans catégorie</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>

        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prix (€)</label>
        <input type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 mt-1 outline-none focus:border-blue-400"
        />

        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Photo</label>
        <div className="flex gap-2 mt-1 mb-5">
          <button onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-500 text-sm font-medium"
          >
            {uploading ? '⏳ Upload...' : '📷 Prendre / Choisir une photo'}
          </button>
          {photoUrl && (
            <button onClick={() => setShowPhoto(true)} className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
              <img src={photoUrl} alt="preview" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold">Annuler</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold">Enregistrer</button>
        </div>
      </div>

      {showPhoto && photoUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPhoto(false)}>
          <img src={photoUrl} alt="photo" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
        {children}
      </div>
    </div>
  )
}
