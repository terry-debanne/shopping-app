'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<Item | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [{ data: cat }, { data: itms }] = await Promise.all([
      supabase.from('categories').select('*').eq('id', id).single(),
      supabase.from('items').select('*').eq('category_id', id).order('name'),
    ])
    setCategory(cat)
    setItems(itms ?? [])
    setLoading(false)
  }

  async function toggleNeeded(item: Item) {
    const newVal = !item.needed
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, needed: newVal } : i))
    await supabase.from('items').update({ needed: newVal }).eq('id', item.id)
  }

  function handleSaved(updated: Item) {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    setEditItem(null)
  }

  const neededCount = items.filter(i => i.needed).length

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-3xl">⏳</div></div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{category?.emoji} {category?.name}</h1>
            {neededCount > 0 && <p className="text-sm text-blue-500 font-medium">{neededCount} à acheter</p>}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-lg">Aucun article</p>
          <Link href="/catalogue" className="text-blue-500 underline text-sm mt-1 block">Ajouter des articles</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              categoryEmoji={category?.emoji ?? '🛒'}
              onToggle={toggleNeeded}
              onEdit={setEditItem}
            />
          ))}
        </div>
      )}

      {editItem && (
        <EditModal item={editItem} onClose={() => setEditItem(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}

function ItemCard({
  item,
  categoryEmoji,
  onToggle,
  onEdit,
}: {
  item: Item
  categoryEmoji: string
  onToggle: (i: Item) => void
  onEdit: (i: Item) => void
}) {
  return (
    <div className="relative">
      <button
        onClick={() => onToggle(item)}
        className={`w-full flex flex-col items-center justify-center aspect-square rounded-2xl shadow-sm transition-all active:scale-95 px-2 ${
          item.needed ? 'bg-blue-500 text-white shadow-blue-200 shadow-md' : 'bg-white text-gray-700'
        }`}
      >
        {/* Photo ou emoji */}
        <div className="relative mb-1">
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <span className={`text-3xl ${item.needed ? '' : 'grayscale opacity-60'}`}>
              {item.needed ? '✓' : categoryEmoji}
            </span>
          )}
          {item.photo_url && (
            <span className="absolute -top-1 -right-1 text-sm">📷</span>
          )}
        </div>

        <span className={`text-xs font-semibold text-center leading-tight ${item.needed ? 'text-white' : 'text-gray-600'}`}>
          {item.name}
        </span>

        {item.price != null && (
          <span className={`text-xs font-bold mt-0.5 ${item.needed ? 'text-blue-100' : 'text-blue-500'}`}>
            {item.price.toFixed(2)} €
          </span>
        )}
      </button>

      {/* Bouton édition */}
      <button
        onClick={() => onEdit(item)}
        className="absolute top-1 left-1 w-6 h-6 bg-black/20 rounded-full flex items-center justify-center text-white text-xs leading-none"
      >
        ✏️
      </button>
    </div>
  )
}

function EditModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: (i: Item) => void }) {
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(item.price != null ? String(item.price) : '')
  const [photoUrl, setPhotoUrl] = useState(item.photo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `items/${item.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('item-photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('item-photos').getPublicUrl(path)
      setPhotoUrl(data.publicUrl)
    }
    setUploading(false)
  }

  async function save() {
    const updates: Partial<Item> = {
      name: name.trim(),
      price: price !== '' ? parseFloat(price) : null,
      photo_url: photoUrl || null,
    }
    const { data } = await supabase.from('items').update(updates).eq('id', item.id).select('*').single()
    if (data) onSaved(data)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Modifier l&apos;article</h3>

        {/* Nom */}
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 mt-1 outline-none focus:border-blue-400"
        />

        {/* Prix */}
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prix (€)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 mt-1 outline-none focus:border-blue-400"
        />

        {/* Photo */}
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Photo</label>
        <div className="flex gap-2 mt-1 mb-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-500 text-sm font-medium hover:border-blue-400 transition-colors"
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

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold">
            Annuler
          </button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold">
            Enregistrer
          </button>
        </div>
      </div>

      {/* Affichage photo plein écran */}
      {showPhoto && photoUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPhoto(false)}>
          <img src={photoUrl} alt="photo" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  )
}
