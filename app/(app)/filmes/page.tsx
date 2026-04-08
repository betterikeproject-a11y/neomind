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

const card   = 'bg-[#252529] rounded-2xl p-5'
const inp    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const tarea  = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const sel    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const cta    = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
const lbl    = 'text-sm text-[#88889a] mb-2 block'
const div_   = 'border-t border-[rgba(255,255,255,0.07)]'

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" onClick={() => onChange(value === n ? 0 : n)}
          className={`text-xl transition-colors ${n <= value ? 'text-[#5b94d6]' : 'text-[#2d2d33] hover:text-[#3d3d4d]'}`}
        >★</button>
      ))}
    </div>
  )
}

function StarDisplay({ value }: { value: number | null }) {
  if (!value) return <span className="text-[#4a4a5a] text-sm">Sem avaliação</span>
  return (
    <span className="text-[#5b94d6] text-sm">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
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
          <h2 className="text-3xl font-bold text-[#f0f0f5]">Filmes</h2>
          <p className="text-[#88889a] text-sm mt-1">{movies.length} filme{movies.length !== 1 ? 's' : ''} registrado{movies.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#252529] text-[#5b94d6] text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-[#2d2d33]"
        >
          {showForm ? 'Cancelar' : '+ Registrar filme'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
          <h3 className="text-sm font-semibold text-[#88889a]">Registrar filme assistido</h3>

          <div>
            <label className={lbl}>Título *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Nome do filme"
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Diretor</label>
              <input
                type="text" value={form.director}
                onChange={e => setForm(p => ({ ...p, director: e.target.value }))}
                placeholder="Nome do diretor"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Ano do filme</label>
              <input
                type="number" value={form.year} min={1888} max={new Date().getFullYear() + 2}
                onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                placeholder="ex: 2024"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Data que assistiu</label>
            <input
              type="date" value={form.watched_at} max={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, watched_at: e.target.value }))}
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>Avaliação</label>
            <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>

          <div>
            <label className={lbl}>Notas / impressões</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="O que achei, o que me marcou..."
              className={tarea}
            />
          </div>

          <button type="submit" disabled={saving} className={cta}>
            {saving ? 'Salvando...' : 'Salvar filme'}
          </button>
        </form>
      )}

      {/* List grouped by year */}
      {movies.length === 0 && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-sm">Nenhum filme registrado ainda</p>
        </div>
      )}

      {years.map(year => (
        <div key={year}>
          <h3 className="text-xs font-semibold text-[#4a4a5a] uppercase tracking-wider mb-3">{year}</h3>
          <div className={card}>
            {grouped[year].map((m, idx) => (
              <div key={m.id}>
                {idx > 0 && <div className={`${div_} my-4`} />}
                <div className="flex items-start gap-4 group">
                  <span className="text-2xl mt-0.5 shrink-0">🎬</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[#f0f0f5] font-medium">
                          {m.title}
                          {m.year && <span className="text-[#88889a] text-sm font-normal ml-2">({m.year})</span>}
                        </p>
                        {m.director && <p className="text-[#88889a] text-xs mt-0.5">dir. {m.director}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-[#4a4a5a] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-lg leading-none"
                      >×</button>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <StarDisplay value={m.rating} />
                      <span className="text-[#4a4a5a] text-xs">
                        {new Date(m.watched_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {m.notes && <p className="text-[#88889a] text-sm mt-2 leading-relaxed">{m.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
