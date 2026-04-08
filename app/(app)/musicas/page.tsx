'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type MusicLog = {
  id: string
  artist: string
  album: string
  track: string
  genre: string
  rating: number | null
  notes: string
  listened_at: string
  created_at: string
}

const defaultForm = {
  artist: '', album: '', track: '', genre: '', rating: 0,
  notes: '', listened_at: new Date().toISOString().split('T')[0],
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
  if (!value) return null
  return <span className="text-yellow-400 text-xs">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
}

export default function MusicasPage() {
  const [logs, setLogs] = useState<MusicLog[]>([])
  const [form, setForm] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('music_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('listened_at', { ascending: false })
    if (data) setLogs(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.artist.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      artist: form.artist.trim(),
      album: form.album.trim(),
      track: form.track.trim(),
      genre: form.genre.trim(),
      rating: form.rating || null,
      notes: form.notes.trim(),
      listened_at: form.listened_at || new Date().toISOString().split('T')[0],
    }

    const { data } = await supabase.from('music_logs').insert(payload).select().single()
    if (data) setLogs(prev => [data, ...prev])

    setForm({ ...defaultForm, listened_at: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('music_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  // Group by month
  const grouped = logs.reduce<Record<string, MusicLog[]>>((acc, l) => {
    const key = l.listened_at.slice(0, 7) // YYYY-MM
    if (!acc[key]) acc[key] = []
    acc[key].push(l)
    return acc
  }, {})
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  function formatMonth(ym: string) {
    const [y, m] = ym.split('-')
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Músicas</h2>
          <p className="text-gray-500 text-sm mt-0.5">{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Registrar música'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Registrar música / álbum ouvido</h3>

          <div>
            <label className={labelClass}>Artista *</label>
            <input
              type="text" required value={form.artist}
              onChange={e => setForm(p => ({ ...p, artist: e.target.value }))}
              placeholder="Nome do artista ou banda"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Álbum</label>
              <input
                type="text" value={form.album}
                onChange={e => setForm(p => ({ ...p, album: e.target.value }))}
                placeholder="Nome do álbum"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Faixa</label>
              <input
                type="text" value={form.track}
                onChange={e => setForm(p => ({ ...p, track: e.target.value }))}
                placeholder="Música específica"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gênero</label>
              <input
                type="text" value={form.genre}
                onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                placeholder="ex: Jazz, Rap, MPB..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Data que ouviu</label>
              <input
                type="date" value={form.listened_at} max={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, listened_at: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Avaliação</label>
            <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>

          <div>
            <label className={labelClass}>Notas / o que sentiu</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="O que essa música / álbum despertou em mim..."
              className={inputClass + ' resize-none'}
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar registro'}
          </button>
        </form>
      )}

      {/* List */}
      {logs.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-sm">Nenhuma música registrada ainda</p>
        </div>
      )}

      {months.map(month => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3 capitalize">{formatMonth(month)}</h3>
          <div className="space-y-2">
            {grouped[month].map(l => (
              <div key={l.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-4 group">
                <span className="text-2xl mt-0.5 shrink-0">🎵</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-gray-100 font-medium">{l.artist}</p>
                      <p className="text-gray-500 text-sm">
                        {[l.album, l.track].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(l.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-lg leading-none"
                    >×</button>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {l.genre && (
                      <span className="text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/40 px-2 py-0.5 rounded-full">
                        {l.genre}
                      </span>
                    )}
                    <StarDisplay value={l.rating} />
                    <span className="text-gray-600 text-xs">
                      {new Date(l.listened_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {l.notes && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{l.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
