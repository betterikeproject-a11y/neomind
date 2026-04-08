'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type JournalMode = 'cru' | 'poetico'

type JournalEntry = {
  id: string
  date: string
  raw_content: string
  poetic_content: string | null
  mode: JournalMode
}

type FormState = {
  what_happened: string
  how_i_felt: string
  what_i_avoided: string
  mode: JournalMode
}

const defaultForm: FormState = {
  what_happened: '', how_i_felt: '', what_i_avoided: '', mode: 'cru',
}

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
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (data) {
      setEntries(data)
      const te = data.find(e => e.date === today)
      if (te) {
        setTodayEntry(te)
        const parts = te.raw_content.split('\n---\n')
        setForm({
          what_happened: parts[0] || '',
          how_i_felt: parts[1] || '',
          what_i_avoided: parts[2] || '',
          mode: te.mode,
        })
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: raw_content }),
        })
        const json = await res.json()
        poetic_content = json.result || null
      } catch {
        poetic_content = null
      }
      setPoetizing(false)
    }

    const payload = { raw_content, poetic_content, mode: form.mode, user_id: user.id, date: today }

    if (todayEntry) {
      const { data } = await supabase.from('journal_entries').update(payload).eq('id', todayEntry.id).select().single()
      if (data) {
        setTodayEntry(data)
        setEntries(prev => prev.map(e => e.id === data.id ? data : e))
      }
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single()
      if (data) {
        setTodayEntry(data)
        setEntries(prev => [data, ...prev])
      }
    }

    setSaving(false)
  }

  const pastEntries = entries.filter(e => e.date !== today)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Diário</h2>
        <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Today's entry */}
      <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hoje</h3>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setForm(p => ({ ...p, mode: 'cru' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                form.mode === 'cru' ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              Cru
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, mode: 'poetico' }))}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                form.mode === 'poetico' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              ✨ Poético
            </button>
          </div>
        </div>

        {form.mode === 'poetico' && (
          <p className="text-xs text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 rounded-lg px-3 py-2">
            Ao salvar, Claude vai transformar seu texto em prosa poética.
          </p>
        )}

        <div className="space-y-3">
          {[
            { key: 'what_happened', prompt: 'O que aconteceu?' },
            { key: 'how_i_felt', prompt: 'Como me senti?' },
            { key: 'what_i_avoided', prompt: 'O que evitei?' },
          ].map(({ key, prompt }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1.5 block">{prompt}</label>
              <textarea
                value={form[key as keyof FormState] as string}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                rows={3}
                placeholder={`${prompt}...`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || poetizing}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {poetizing ? '✨ Poetizando...' : saving ? 'Salvando...' : todayEntry ? 'Atualizar' : 'Salvar'}
        </button>

        {/* Show poetic result */}
        {todayEntry?.poetic_content && form.mode === 'poetico' && (
          <div className="bg-gray-800/50 border border-indigo-900/30 rounded-xl p-4 mt-2">
            <p className="text-xs text-indigo-400 mb-2 font-medium">Versão poética</p>
            <p className="text-gray-300 text-sm leading-relaxed italic whitespace-pre-wrap">{todayEntry.poetic_content}</p>
          </div>
        )}
      </div>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Entradas anteriores</h3>
          {pastEntries.map(entry => {
            const parts = entry.raw_content.split('\n---\n')
            const isExpanded = expandedId === entry.id
            return (
              <div
                key={entry.id}
                className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    {entry.mode === 'poetico' && entry.poetic_content && (
                      <span className="text-xs text-indigo-400">✨</span>
                    )}
                  </div>
                  <span className="text-gray-600 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                    {parts[0] && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">O que aconteceu?</p>
                        <p className="text-gray-300 text-sm">{parts[0]}</p>
                      </div>
                    )}
                    {parts[1] && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Como me senti?</p>
                        <p className="text-gray-300 text-sm">{parts[1]}</p>
                      </div>
                    )}
                    {parts[2] && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">O que evitei?</p>
                        <p className="text-gray-300 text-sm">{parts[2]}</p>
                      </div>
                    )}
                    {entry.mode === 'poetico' && entry.poetic_content && (
                      <div className="bg-gray-800/50 border border-indigo-900/30 rounded-xl p-4 mt-2">
                        <p className="text-xs text-indigo-400 mb-2">Versão poética</p>
                        <p className="text-gray-300 text-sm leading-relaxed italic whitespace-pre-wrap">{entry.poetic_content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
