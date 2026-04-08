'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else { router.push('/cockpit'); router.refresh() }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nm-bg px-5">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-nm-text">NeoMind</h1>
          <p className="text-nm-muted text-sm mt-1">Cockpit mental pessoal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full bg-nm-surface2 rounded-xl px-4 py-4 text-nm-text text-sm placeholder-nm-faint outline-none focus:ring-1 focus:ring-nm-blue transition-all border-0"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Senha"
            className="w-full bg-nm-surface2 rounded-xl px-4 py-4 text-nm-text text-sm placeholder-nm-faint outline-none focus:ring-1 focus:ring-nm-blue transition-all border-0"
          />

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-nm-blue-dim text-nm-blue font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40 mt-2"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
