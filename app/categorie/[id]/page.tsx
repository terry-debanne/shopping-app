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

  useEffect(() => { fetchData() }, [id])

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
    if (item.needed) {
      // Déjà sélectionné → retirer
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, needed: false, quantity: 1 } : i))
      await supabase.from('items').update({ needed: false, quantity: 1 }).eq('id', item.id)
    } else {
      // Ajouter avec qté 1
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, needed: true, quantity: 1 } : i))
      await supabase.from('items').update({ needed: true, quantity: 1 }).eq('id', item.id)
    }
  }

  async function changeQty(item: Item, delta: number) {
    const newQty = Math.max(1, (item.quantity ?? 1) + delta)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))
    await supabase.from('items').update({ quantity: newQty }).eq('id', item.id)
  }

  const neededCount = items.filter(i => i.needed).length

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-3xl">⏳</div></div>

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      <div className="pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="text-2xl">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{category?.emoji} {category?.name}</h1>
          {neededCount > 0 && <p className="text-sm text-blue-500 font-medium">{neededCount} à acheter</p>}
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
              onChangeQty={changeQty}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemCard({ item, categoryEmoji, onToggle, onChangeQty }: {
  item: Item
  categoryEmoji: string
  onToggle: (i: Item) => void
  onChangeQty: (i: Item, delta: number) => void
}) {
  const qty = item.quantity ?? 1

  return (
    <div className={`relative flex flex-col rounded-2xl shadow-sm overflow-hidden transition-all ${
      item.needed ? 'bg-blue-500 shadow-blue-200 shadow-md' : 'bg-white'
    }`}>
      {/* Zone principale cliquable */}
      <button
        onClick={() => onToggle(item)}
        className="flex flex-col items-center justify-center pt-3 pb-2 px-2 active:scale-95 transition-all"
      >
        {/* Photo ou emoji */}
        <div className="relative mb-1">
          {item.photo_url ? (
            <img src={item.photo_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <span className={`text-3xl block ${item.needed ? '' : 'grayscale opacity-60'}`}>
              {item.needed ? '✓' : categoryEmoji}
            </span>
          )}
          {/* Icône photo uniquement si photo existe */}
          {item.photo_url && !item.needed && (
            <span className="absolute -top-1 -right-1 text-xs">📷</span>
          )}
        </div>

        <span className={`text-xs font-semibold text-center leading-tight px-1 ${item.needed ? 'text-white' : 'text-gray-600'}`}>
          {item.name}
        </span>

        {item.price != null && (
          <span className={`text-xs font-bold mt-0.5 ${item.needed ? 'text-blue-100' : 'text-blue-500'}`}>
            {item.price.toFixed(2)} €
          </span>
        )}
      </button>

      {/* Contrôle quantité — visible uniquement si needed */}
      {item.needed && (
        <div className="flex items-center justify-between px-2 pb-2">
          <button
            onClick={() => onChangeQty(item, -1)}
            className="w-7 h-7 rounded-full bg-white/30 text-white font-bold text-lg flex items-center justify-center active:scale-90"
          >
            −
          </button>
          <span className="text-white font-bold text-base">{qty}</span>
          <button
            onClick={() => onChangeQty(item, +1)}
            className="w-7 h-7 rounded-full bg-white/30 text-white font-bold text-lg flex items-center justify-center active:scale-90"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
