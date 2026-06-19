'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase, type Item, type Category } from '@/lib/supabase'

type ItemWithChecked = Item & { checked: boolean }

export default function Liste() {
  const [items, setItems] = useState<ItemWithChecked[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: cats }, { data: itms }] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('items').select('*, category:categories(*)').eq('needed', true).order('name'),
    ])
    setCategories(cats ?? [])
    setItems((itms ?? []).map(i => ({ ...i, checked: false })))
    setLoading(false)
  }

  function toggleChecked(id: number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  async function terminerCourses() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    if (checkedIds.length === 0) return
    setItems(prev => prev.filter(i => !i.checked))
    setShowConfirm(false)
    await supabase.from('items').update({ needed: false }).in('id', checkedIds)
  }

  const unchecked = items.filter(i => !i.checked)
  const checked = items.filter(i => i.checked)
  const checkedCount = checked.length

  const getCat = (id: number) => categories.find(c => c.id === id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-3xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-28">
      {/* Header */}
      <div className="pt-6 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🛒 Liste de courses</h1>
        {checkedCount > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Courses terminées
          </button>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Courses terminées ?</h3>
            <p className="text-gray-500 mb-6">{checkedCount} article{checkedCount > 1 ? 's' : ''} coché{checkedCount > 1 ? 's' : ''} seront retirés de la liste.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-semibold">
                Annuler
              </button>
              <button onClick={terminerCourses} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-lg">Rien à acheter !</p>
          <p className="text-sm mt-1">Sélectionne des articles depuis l&apos;accueil</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Non cochés, groupés par catégorie */}
          {categories
            .filter(cat => unchecked.some(i => i.category_id === cat.id))
            .map(cat => (
              <div key={cat.id}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">{cat.emoji} {cat.name}</p>
                <div className="space-y-1">
                  {unchecked.filter(i => i.category_id === cat.id).map(item => (
                    <ItemLine key={item.id} item={item} cat={cat} onToggle={toggleChecked} />
                  ))}
                </div>
              </div>
            ))
          }
          {unchecked.filter(i => !i.category_id).map(item => (
            <ItemLine key={item.id} item={item} cat={undefined} onToggle={toggleChecked} />
          ))}

          {/* Séparateur */}
          {checked.length > 0 && unchecked.length > 0 && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="text-xs text-gray-400 font-medium">Dans le panier</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
          )}

          {/* Cochés */}
          {checked.map(item => (
            <ItemLine key={item.id} item={item} cat={getCat(item.category_id)} onToggle={toggleChecked} />
          ))}
        </div>
      )}
    </div>
  )
}

function ItemLine({
  item,
  cat,
  onToggle,
}: {
  item: ItemWithChecked
  cat: Category | undefined
  onToggle: (id: number) => void
}) {
  const [showPhoto, setShowPhoto] = useState(false)

  return (
    <>
      <div className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-left transition-all ${
        item.checked ? 'bg-gray-100' : 'bg-white shadow-sm'
      }`}>
        {/* Checkbox */}
        <button onClick={() => onToggle(item.id)} className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
          item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
        }`}>
          {item.checked && <span className="text-sm font-bold">✓</span>}
        </button>

        {/* Emoji catégorie */}
        <span className="text-2xl flex-shrink-0">{cat?.emoji ?? '🛒'}</span>

        {/* Nom + catégorie */}
        <button onClick={() => onToggle(item.id)} className="flex-1 min-w-0 text-left">
          <p className={`font-medium text-base ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {item.name}
          </p>
          {cat && (
            <p className="text-xs text-gray-400">{cat.name}</p>
          )}
        </button>

        {/* Qté + Prix */}
        <button onClick={() => onToggle(item.id)} className="flex flex-col items-end flex-shrink-0 gap-0.5">
          {(item.quantity ?? 1) > 1 && (
            <span className={`text-sm font-bold ${item.checked ? 'text-gray-400' : 'text-blue-500'}`}>
              x{item.quantity}
            </span>
          )}
          {item.price != null && (
            <span className={`text-sm font-semibold ${item.checked ? 'text-gray-400' : 'text-gray-600'}`}>
              {item.price.toFixed(2)} €
            </span>
          )}
        </button>

        {/* Icône photo */}
        {item.photo_url && (
          <button onClick={() => setShowPhoto(true)} className="flex-shrink-0 text-xl opacity-60">
            📷
          </button>
        )}
      </div>

      {/* Plein écran photo */}
      {showPhoto && item.photo_url && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowPhoto(false)}>
          <img src={item.photo_url} alt={item.name} className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  )
}
