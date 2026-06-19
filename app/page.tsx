'use client'

import { useEffect, useState } from 'react'
import { supabase, type Category, type Item } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [neededByCategory, setNeededByCategory] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: cats }, { data: items }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('items').select('id, category_id, needed').eq('needed', true),
    ])
    setCategories(cats ?? [])
    const counts: Record<number, number> = {}
    for (const item of items ?? []) {
      if (item.category_id) counts[item.category_id] = (counts[item.category_id] ?? 0) + 1
    }
    setNeededByCategory(counts)
    setLoading(false)
  }

  const totalNeeded = Object.values(neededByCategory).reduce((a, b) => a + b, 0)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🛒 Courses</h1>
          {totalNeeded > 0 && (
            <p className="text-sm text-blue-500 font-medium mt-0.5">{totalNeeded} article{totalNeeded > 1 ? 's' : ''} à acheter</p>
          )}
        </div>
        <Link
          href="/catalogue"
          className="text-sm bg-gray-200 text-gray-600 px-3 py-2 rounded-xl font-medium"
        >
          Catalogue
        </Link>
      </div>

      {/* Grille catégories */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-lg">Aucune catégorie</p>
          <Link href="/catalogue" className="text-blue-500 underline text-sm mt-1 block">
            Créer des catégories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {categories.map(cat => {
            const count = neededByCategory[cat.id] ?? 0
            return (
              <Link
                key={cat.id}
                href={`/categorie/${cat.id}`}
                className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl shadow-sm transition-all active:scale-95 ${
                  count > 0
                    ? 'bg-blue-500 text-white shadow-blue-200 shadow-md'
                    : 'bg-white text-gray-700'
                }`}
              >
                {count > 0 && (
                  <span className="absolute top-2 right-2 bg-white text-blue-500 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                    {count}
                  </span>
                )}
                <span className="text-4xl mb-2">{cat.emoji}</span>
                <span className={`text-xs font-semibold text-center px-2 leading-tight ${count > 0 ? 'text-white' : 'text-gray-600'}`}>
                  {cat.name}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
