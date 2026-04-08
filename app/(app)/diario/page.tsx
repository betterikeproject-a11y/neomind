'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Design constants ─────────────────────────────────────────────────────────
const card  = 'bg-[#252529] rounded-2xl p-5'
const tarea = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const cta   = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
// ─────────────────────────────────────────────────────────────────────────────

type JournalMode = 'cru' | 'poetico'

type JournalEntry = {
  id: string; date: string; raw_content: string
  poetic_content: string | null; mode: JournalMode
}

type FormState = {
  what_happened: string; how_i_felt: string; what_i_avoided: string; mode: JournalMode
}

const defaultForm: FormState = {
  what_happened: '', how_i_felt: '', what_i_avoided: '', mode: 'cru',
}

const PROMPTS = [
  { key: 'what_happened', prompt: 'O que aconteceu?' },
  { key: 'how_i_felt',    prompt: 'Como me senti?'  },
  { key: 'what_i_avoided',prompt: 'O que evitei?'   },
]

export default function DiarioPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [form, setForm] = useState<FormState>(defaultForm)
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null)
  const [saving, setSaving] = useState(false)
  const [poetizing, setPoetizing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('journal_entries').select('*').eq('user_id', user.id)
      .order('date', { ascending: false })
    if (data) {
      setEntries(data)
      const te = data.find(e => e.date === today)
      if (te) {
        setTodayEntry(te)
        const parts = te.raw_content.split('\n---\n')
        setForm({ what_happened: parts[0] || '', how_i_felt: parts[1] || '',
          what_i_avoided: parts[2] || '', mode: te.mode })
      }
    }
  }, [supabase, today])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!form.what_happened.trim() && !form.how_i_felt.trim() && !form.what_i_avoided.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const raw_content = [form.what_happened, form.how_i_felt, form.what_i_avoided].join('\n---\n')
    let poetic_content: string | null = todayEntry?.poetic_content || null

    if (form.mode === 'poetico') {
      setPoetizing(true)
      try {
        const res = await fetch('/api/poeticize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: raw_content }),
        })
        const json = await res.json()
        poetic_content = json.result || null
      } catch { poetic_content = null }
      setPoetizing(false)
    }

    const payload = { raw_content, poetic_content, mode: form.mode, user_id: user.id, date: today }

    if (todayEntry) {
      const { data } = await supabase.from('journal_entries').update(payload).eq('id', todayEntry.id).select().single()
      if (data) { setTodayEntry(data); setEntries(prev => prev.map(e => e.id === data.id ? data : e)) }
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single()
      if (data) { setTodayEntry(data); setEntries(prev => [data, ...prev]) }
    }
    setSaving(false)
  }

  const pastEntries = entries.filter(e => e.date !== today)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[#f0f0f5]">Diário</h2>
        <p className="text-[#88889a] text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Today's entry */}
      <div className={card + ' space-y-5'}>
        {/* Mode toggle */}
        <div className="flex items-center justify-between">
          <p className="text-[#88889a] text-sm">Hoje</p>
          <div className="flex items-center gap-1 bg-[#2d2d33] rounded-lg p-1">
            <button
              onClick={() => setForm(p => ({ ...p, mode: 'cru' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                form.mode === 'cru' ? 'bg-[#252529] text-[#f0f0f5]' : 'text-[#4a4a5a] hover:text-[#88889a]'
              }`}
            >
              Cru
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, mode: 'poetico' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                form.mode === 'poetico'
                  ? 'bg-[#1f2d45] text-[#5b94d6]'
                  : 'text-[#4a4a5a] hover:text-[#88889a]'
              }`}
            >
              ✨ Poético
            </button>
          </div>
        </div>

        {form.mode === 'poetico' && (
          <p className="text-xs text-[#5b94d6] bg-[#1f2d45] rounded-xl px-4 py-3">
            Ao salvar, Claude vai transformar seu texto em prosa poética.
          </p>
        )}

        {/* Prompts */}
        <div className="space-y-3">
          {PROMPTS.map(({ key, prompt }) => (
            <div key={key}>
              <p className="text-xs text-[#4a4a5a] mb-1.5">{prompt}</p>
              <textarea
                value={form[key as keyof FormState] as string}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                rows={3} placeholder={`${prompt}...`}
                className={tarea}
              />
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving || poetizing} className={cta}>
          {poetizing ? '✨ Poetizando...' : saving ? 'Salvando...' : todayEntry ? 'Atualizar' : 'Salvar'}
        </button>

        {/* Poetic result */}
        {todayEntry?.poetic_content && form.mode === 'poetico' && (
          <div className="bg-[#2d2d33] rounded-xl p-4">
            <p className="text-xs text-[#5b94d6] mb-2 font-medium">Versão poética</p>
            <p className="text-[#f0f0f5] text-sm leading-relaxed italic whitespace-pre-wrap">
              {todayEntry.poetic_content}
            </p>
          </div>
        )}
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div>
          <p className="text-xs text-[#88889a] uppercase tracking-wider font-semibold mb-3">Entradas anteriores</p>
          <div className="bg-[#252529] rounded-2xl overflow-hidden divide-y divide-[rgba(255,255,255,0.07)]">
            {pastEntries.map(entry => {
              const parts = entry.raw_content.split('\n---\n')
              const isExpanded = expandedId === entry.id
              return (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#2d2d33] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[#f0f0f5]">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      {entry.mode === 'poetico' && entry.poetic_content && (
                        <span className="text-xs text-[#5b94d6]">✨</span>
                      )}
                    </div>
                    <span className="text-[#4a4a5a] text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-3">
                      {PROMPTS.map(({ key, prompt }, i) => (
                        parts[i] ? (
                          <div key={key}>
                            <p className="text-xs text-[#4a4a5a] mb-1">{prompt}</p>
                            <p className="text-[#f0f0f5] text-sm leading-relaxed">{parts[i]}</p>
                          </div>
                        ) : null
                      ))}
                      {entry.mode === 'poetico' && entry.poetic_content && (
                        <div className="bg-[#2d2d33] rounded-xl p-4 mt-2">
                          <p className="text-xs text-[#5b94d6] mb-2">Versão poética</p>
                          <p className="text-[#f0f0f5] text-sm leading-relaxed italic whitespace-pre-wrap">
                            {entry.poetic_content}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
