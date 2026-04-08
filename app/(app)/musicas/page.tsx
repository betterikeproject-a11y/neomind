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
  if (!value) return null
  return <span className="text-[#5b94d6] text-xs">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
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
          <h2 className="text-3xl font-bold text-[#f0f0f5]">Músicas</h2>
          <p className="text-[#88889a] text-sm mt-1">{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#252529] text-[#5b94d6] text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-[#2d2d33]"
        >
          {showForm ? 'Cancelar' : '+ Registrar música'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
          <h3 className="text-sm font-semibold text-[#88889a]">Registrar música / álbum ouvido</h3>

          <div>
            <label className={lbl}>Artista *</label>
            <input
              type="text" required value={form.artist}
              onChange={e => setForm(p => ({ ...p, artist: e.target.value }))}
              placeholder="Nome do artista ou banda"
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Álbum</label>
              <input
                type="text" value={form.album}
                onChange={e => setForm(p => ({ ...p, album: e.target.value }))}
                placeholder="Nome do álbum"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Faixa</label>
              <input
                type="text" value={form.track}
                onChange={e => setForm(p => ({ ...p, track: e.target.value }))}
                placeholder="Música específica"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Gênero</label>
              <input
                type="text" value={form.genre}
                onChange={e => setForm(p => ({ ...p, genre: e.target.value }))}
                placeholder="ex: Jazz, Rap, MPB..."
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Data que ouviu</label>
              <input
                type="date" value={form.listened_at} max={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, listened_at: e.target.value }))}
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Avaliação</label>
            <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>

          <div>
            <label className={lbl}>Notas / o que sentiu</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="O que essa música / álbum despertou em mim..."
              className={tarea}
            />
          </div>

          <button type="submit" disabled={saving} className={cta}>
            {saving ? 'Salvando...' : 'Salvar registro'}
          </button>
        </form>
      )}

      {/* List */}
      {logs.length === 0 && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">🎵</p>
          <p className="text-sm">Nenhuma música registrada ainda</p>
        </div>
      )}

      {months.map(month => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-[#4a4a5a] uppercase tracking-wider mb-3 capitalize">{formatMonth(month)}</h3>
          <div className={card}>
            {grouped[month].map((l, idx) => (
              <div key={l.id}>
                {idx > 0 && <div className={`${div_} my-4`} />}
                <div className="flex items-start gap-4 group">
                  <span className="text-2xl mt-0.5 shrink-0">🎵</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[#f0f0f5] font-medium">{l.artist}</p>
                        <p className="text-[#88889a] text-sm">
                          {[l.album, l.track].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(l.id)}
                        className="text-[#4a4a5a] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 text-lg leading-none"
                      >×</button>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {l.genre && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-[#1f2d45] text-[#5b94d6]">
                          {l.genre}
                        </span>
                      )}
                      <StarDisplay value={l.rating} />
                      <span className="text-[#4a4a5a] text-xs">
                        {new Date(l.listened_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {l.notes && <p className="text-[#88889a] text-sm mt-2 leading-relaxed">{l.notes}</p>}
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
