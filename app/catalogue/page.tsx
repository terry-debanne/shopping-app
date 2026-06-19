'use client'

import { useEffect, useState } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'
import Link from 'next/link'

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

  useEffect(() => {
    fetchData()
  }, [])

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
    if (hasItems) {
      alert('Supprimez d\'abord les articles de cette catégorie.')
      return
    }
    setCategories(prev => prev.filter(c => c.id !== id))
    await supabase.from('categories').delete().eq('id', id)
  }

  const byCategory = categories.map(cat => ({
    category: cat,
    items: items.filter(i => i.category_id === cat.id),
  }))
  const uncategorized = items.filter(i => !i.category_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-slate-100 pt-4 pb-3 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blue-500 text-lg">← </Link>
            <h1 className="text-2xl font-bold text-gray-800">Catalogue</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium"
            >
              + Catégorie
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="text-sm bg-blue-500 text-white px-3 py-2 rounded-xl font-medium"
            >
              + Article
            </button>
          </div>
        </div>
      </div>

      {/* Add item modal */}
      {showAddItem && (
        <Modal title="Nouvel article" onClose={() => setShowAddItem(false)}>
          <input
            autoFocus
            type="text"
            placeholder="Nom de l'article"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg mb-3 outline-none focus:border-blue-400"
          />
          <select
            value={newItemCategory ?? ''}
            onChange={e => setNewItemCategory(e.target.value ? Number(e.target.value) : null)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base mb-4 outline-none focus:border-blue-400 bg-white"
          >
            <option value="">Sans catégorie</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
          <button
            onClick={addItem}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-lg"
          >
            Ajouter
          </button>
        </Modal>
      )}

      {/* Add category modal */}
      {showAddCategory && (
        <Modal title="Nouvelle catégorie" onClose={() => setShowAddCategory(false)}>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Emoji"
              value={newCatEmoji}
              onChange={e => setNewCatEmoji(e.target.value)}
              className="w-16 border border-gray-200 rounded-xl px-3 py-3 text-2xl text-center outline-none focus:border-blue-400"
            />
            <input
              autoFocus
              type="text"
              placeholder="Nom de la catégorie"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-400"
            />
          </div>
          <button
            onClick={addCategory}
            className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold text-lg"
          >
            Ajouter
          </button>
        </Modal>
      )}

      {/* Content */}
      <div className="mt-3 space-y-5">
        {byCategory.map(({ category, items: catItems }) => (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {category.emoji} {category.name}
              </h2>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-red-300 text-xs hover:text-red-500"
              >
                Supprimer
              </button>
            </div>
            <div className="space-y-2">
              {catItems.map(item => (
                <CatalogueRow key={item.id} item={item} onDelete={deleteItem} />
              ))}
              {catItems.length === 0 && (
                <p className="text-sm text-gray-300 px-4 py-2">Aucun article</p>
              )}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Sans catégorie
            </h2>
            <div className="space-y-2">
              {uncategorized.map(item => (
                <CatalogueRow key={item.id} item={item} onDelete={deleteItem} />
              ))}
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

function CatalogueRow({ item, onDelete }: { item: Item; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
      <span className="text-gray-700 font-medium flex-1">{item.name}</span>
      <button
        onClick={() => onDelete(item.id)}
        className="text-red-300 hover:text-red-500 text-xl ml-2 p-1"
      >
        ×
      </button>
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
