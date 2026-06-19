'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const KEYS = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']

export default function Login() {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  function handleKey(k: string) {
    if (k === '⌫') {
      setCode(prev => prev.slice(0, -1))
      setError(false)
    } else if (k === '✓') {
      if (code === process.env.NEXT_PUBLIC_APP_PASSWORD) {
        document.cookie = 'app-auth=ok; path=/'
        window.location.href = '/'
      } else {
        setError(true)
        setCode('')
      }
    } else {
      setCode(prev => prev + k)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-xs shadow-xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800">Nos courses</h1>
        </div>

        {/* Affichage du code */}
        <div className={`flex justify-center gap-3 mb-2 h-10 items-center`}>
          {code.length === 0 ? (
            <span className="text-gray-300 text-sm">Entrez le code</span>
          ) : (
            code.split('').map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-blue-500" />
            ))
          )}
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-2">Code incorrect</p>}

        {/* Clavier */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {KEYS.map(k => (
            <button
              key={k}
              onClick={() => handleKey(k)}
              className={`py-4 rounded-2xl text-xl font-bold active:scale-95 transition-all ${
                k === '✓'
                  ? 'bg-blue-500 text-white'
                  : k === '⌫'
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
