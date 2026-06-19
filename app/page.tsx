'use client'

import { useEffect, useState } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'needed' | 'all'>('needed')

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

  async function toggleNeeded(item: Item) {
    const newVal = !item.needed
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, needed: newVal } : i))
    await supabase.from('items').update({ needed: newVal }).eq('id', item.id)
  }

  async function clearList() {
    const neededIds = items.filter(i => i.needed).map(i => i.id)
    if (neededIds.length === 0) return
    setItems(prev => prev.map(i => ({ ...i, needed: false })))
    await supabase.from('items').update({ needed: false }).in('id', neededIds)
  }

  const displayedItems = activeTab === 'needed' ? items.filter(i => i.needed) : items

  const byCategory = categories.map(cat => ({
    category: cat,
    items: displayedItems.filter(i => i.category_id === cat.id),
  })).filter(g => g.items.length > 0)

  const uncategorized = displayedItems.filter(i => !i.category_id)
  const neededCount = items.filter(i => i.needed).length

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
      <div className="sticky top-0 bg-slate-100 pt-4 pb-2 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-800">🛒 Courses</h1>
          <div className="flex gap-2">
            {neededCount > 0 && (
              <button
                onClick={clearList}
                className="text-sm bg-green-500 text-white px-3 py-2 rounded-xl font-medium"
              >
                ✓ Tout acheté
              </button>
            )}
            <Link
              href="/catalogue"
              className="text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded-xl font-medium"
            >
              Catalogue
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('needed')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'needed'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            À acheter {neededCount > 0 && <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">{neededCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Tout ({items.length})
          </button>
        </div>
      </div>

      {/* Empty state */}
      {displayedItems.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          {activeTab === 'needed' ? (
            <>
              <div className="text-5xl mb-3">🎉</div>
              <p className="text-lg">Rien à acheter !</p>
              <p className="text-sm mt-1">Appuie sur &quot;Tout&quot; pour ajouter des articles</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">📦</div>
              <p className="text-lg">Catalogue vide</p>
              <Link href="/catalogue" className="text-blue-500 underline text-sm mt-1 block">
                Ajouter des articles
              </Link>
            </>
          )}
        </div>
      )}

      {/* Items by category */}
      <div className="mt-3 space-y-4">
        {byCategory.map(({ category, items: catItems }) => (
          <div key={category.id}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              {category.emoji} {category.name}
            </h2>
            <div className="space-y-2">
              {catItems.map(item => (
                <ItemRow key={item.id} item={item} onToggle={toggleNeeded} />
              ))}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              Autre
            </h2>
            <div className="space-y-2">
              {uncategorized.map(item => (
                <ItemRow key={item.id} item={item} onToggle={toggleNeeded} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemRow({ item, onToggle }: { item: Item; onToggle: (i: Item) => void }) {
  return (
    <button
      onClick={() => onToggle(item)}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-95 ${
        item.needed
          ? 'bg-blue-500 text-white shadow-md'
          : 'bg-white text-gray-700 shadow-sm'
      }`}
    >
      <span className={`text-2xl flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        item.needed ? 'bg-white/20' : 'bg-gray-100'
      }`}>
        {item.needed ? '✓' : '○'}
      </span>
      <span className="text-lg font-medium">{item.name}</span>
    </button>
  )
}
