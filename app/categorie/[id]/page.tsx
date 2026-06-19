'use client'

import { useEffect, useState } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'
import Link from 'next/link'
import { use } from 'react'

export default function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

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

  const neededCount = items.filter(i => i.needed).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-3xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Header */}
      <div className="pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {category?.emoji} {category?.name}
            </h1>
            {neededCount > 0 && (
              <p className="text-sm text-blue-500 font-medium">{neededCount} à acheter</p>
            )}
          </div>
        </div>
        <Link href="/catalogue" className="text-sm bg-gray-200 text-gray-600 px-3 py-2 rounded-xl font-medium">
          Catalogue
        </Link>
      </div>

      {/* Grille articles */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-lg">Aucun article</p>
          <Link href="/catalogue" className="text-blue-500 underline text-sm mt-1 block">
            Ajouter des articles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => toggleNeeded(item)}
              className={`flex flex-col items-center justify-center aspect-square rounded-2xl shadow-sm transition-all active:scale-95 px-2 ${
                item.needed
                  ? 'bg-blue-500 text-white shadow-blue-200 shadow-md'
                  : 'bg-white text-gray-700'
              }`}
            >
              <span className={`text-3xl mb-1 ${item.needed ? '' : 'grayscale opacity-60'}`}>
                {item.needed ? '✓' : category?.emoji ?? '🛒'}
              </span>
              <span className={`text-xs font-semibold text-center leading-tight ${item.needed ? 'text-white' : 'text-gray-600'}`}>
                {item.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
