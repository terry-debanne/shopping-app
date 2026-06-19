'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_APP_PASSWORD) {
      document.cookie = 'app-auth=ok; path=/; max-age=31536000'
      router.push('/')
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🛒</div>
          <h1 className="text-2xl font-bold text-gray-800">Nos courses</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            autoFocus
            className={`w-full border-2 rounded-2xl px-4 py-4 text-xl text-center outline-none mb-4 tracking-widest ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'
            }`}
          />
          {error && <p className="text-red-500 text-sm text-center mb-4">Mot de passe incorrect</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-4 rounded-2xl font-bold text-lg"
          >
            Entrer
          </button>
        </form>
      </div>
    </div>
  )
}
