'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const path = usePathname()

  const isHome = path === '/' || path.startsWith('/categorie')
  const isListe = path === '/liste'
  const isCatalogue = path === '/catalogue'

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="max-w-2xl mx-auto flex">
        <Link href="/" className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${isHome ? 'text-blue-500' : 'text-gray-400'}`}>
          <span className="text-2xl">🏠</span>
          <span>Accueil</span>
        </Link>
        <Link href="/liste" className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${isListe ? 'text-blue-500' : 'text-gray-400'}`}>
          <span className="text-2xl">🛒</span>
          <span>Liste</span>
        </Link>
        <Link href="/catalogue" className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-semibold transition-colors ${isCatalogue ? 'text-blue-500' : 'text-gray-400'}`}>
          <span className="text-2xl">📦</span>
          <span>Catalogue</span>
        </Link>
      </div>
    </div>
  )
}
