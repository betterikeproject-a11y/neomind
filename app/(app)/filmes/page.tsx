'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Movie = {
  id: string
  title: string
  director: string
  year: number | null
  rating: number | null
  notes: string
  watched_at: string
  created_at: string
}

const defaultForm = {
  title: '', director: '', year: '', rating: 0,
  notes: '', watched_at: new Date().toISOString().split('T')[0],
}

const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors'
const labelClass = 'text-xs text-gray-500 mb-1.5 block'

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" onClick={() => onChange(value === n ? 0 : n)}
          className={`text-2xl leading-none transition-colors ${n <= value ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-600'}`}
        >★</button>
      ))}
    </div>
  )
}

function StarDisplay({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-600 text-sm">Sem avaliação</span>
  return (
    <span className="text-yellow-400 text-sm">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
  )
}

export default function FilmesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [form, setForm] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
    if (data) setMovies(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      director: form.director.trim(),
      year: form.year ? Number(form.year) : null,
      rating: form.rating || null,
      notes: form.notes.trim(),
      watched_at: form.watched_at || new Date().toISOString().split('T')[0],
    }

    const { data } = await supabase.from('movies').insert(payload).select().single()
    if (data) setMovies(prev => [data, ...prev])

    setForm({ ...defaultForm, watched_at: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('movies').delete().eq('id', id)
    setMovies(prev => prev.filter(m => m.id !== id))
  }

  // Group by year of watched_at
  const grouped = movies.reduce<Record<string, Movie[]>>((acc, m) => {
    const year = m.watched_at.slice(0, 4)
    if (!acc[year]) acc[year] = []
    acc[year].push(m)
    return acc
  }, {})
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Filmes</h2>
          <p className="text-gray-500 text-sm mt-0.5">{movies.length} filme{movies.length !== 1 ? 's' : ''} registrado{movies.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Registrar filme'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Registrar filme assistido</h3>

          <div>
            <label className={labelClass}>Título *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Nome do filme"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Diretor</label>
              <input
                type="text" value={form.director}
                onChange={e => setForm(p => ({ ...p, director: e.target.value }))}
                placeholder="Nome do diretor"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ano do filme</label>
              <input
                type="number" value={form.year} min={1888} max={new Date().getFullYear() + 2}
                onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                placeholder="ex: 2024"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Data que assistiu</label>
            <input
              type="date" value={form.watched_at} max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, watched_at: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Avaliação</label>
            <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>

          <div>
            <label className={labelClass}>Notas / impressões</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="O que achei, o que me marcou..."
              className={inputClass + ' resize-none'}
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar filme'}
          </button>
        </form>
      )}

      {/* List grouped by year */}
      {movies.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-sm">Nenhum filme registrado ainda</p>
        </div>
      )}

      {years.map(year => (
        <div key={year}>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">{year}</h3>
          <div className="space-y-2">
            {grouped[year].map(m => (
              <div key={m.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-4 group">
                <span className="text-2xl mt-0.5 shrink-0">🎬</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-gray-100 font-medium">
                        {m.title}
                        {m.year && <span className="text-gray-500 text-sm font-normal ml-2">({m.year})</span>}
                      </p>
                      {m.director && <p className="text-gray-500 text-xs mt-0.5">dir. {m.director}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-lg leading-none"
                    >×</button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <StarDisplay value={m.rating} />
                    <span className="text-gray-600 text-xs">
                      {new Date(m.watched_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {m.notes && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{m.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
