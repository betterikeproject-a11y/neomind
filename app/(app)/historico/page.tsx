'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type Checkin = {
  mission: string
  humor: number
  energia: number
  foco: number
  ansiedade: number
  sono: number
  clareza: number
  bloco_manha: string
  bloco_tarde: string
  bloco_noite: string
}

type JournalEntry = {
  raw_content: string
  poetic_content: string | null
  mode: 'cru' | 'poetico'
}

type InboxItem = {
  id: string
  content: string
  category: 'ideia' | 'resolver' | 'incomoda'
  created_at: string
}

type Goal = {
  id: string
  title: string
  area: string
  deadline_days: number
  status: string
  progress: number
}

type DayData = {
  checkin: Checkin | null
  journal: JournalEntry | null
  inbox: InboxItem[]
  goals: Goal[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLIDERS = [
  { key: 'humor', label: 'Humor', emoji: '😊' },
  { key: 'energia', label: 'Energia', emoji: '⚡' },
  { key: 'foco', label: 'Foco', emoji: '🎯' },
  { key: 'ansiedade', label: 'Ansiedade', emoji: '😰' },
  { key: 'sono', label: 'Sono', emoji: '😴' },
  { key: 'clareza', label: 'Clareza', emoji: '💡' },
] as const

const INBOX_CAT: Record<string, { label: string; emoji: string; color: string }> = {
  ideia:    { label: 'Ideia',   emoji: '💡', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
  resolver: { label: 'Resolver', emoji: '🔧', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  incomoda: { label: 'Incomoda', emoji: '😤', color: 'text-red-400 bg-red-950/40 border-red-800/50' },
}

const GOAL_STATUS: Record<string, { label: string; color: string }> = {
  feito:     { label: 'Feito',     color: 'text-green-400 border-green-800/50' },
  avancou:   { label: 'Avançou',   color: 'text-blue-400 border-blue-800/50' },
  travou:    { label: 'Travou',    color: 'text-orange-400 border-orange-800/50' },
  abandonei: { label: 'Abandonei', color: 'text-gray-500 border-gray-700/50' },
}

const AREAS: Record<string, string> = {
  trabalho: '💼', mente: '🧠', corpo: '💪', dinheiro: '💰', social: '🤝',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function todayISO() {
  return toISO(new Date())
}

function dayBounds(dateStr: string) {
  // Use local midnight to avoid UTC-offset issues
  const d = new Date(dateStr + 'T12:00:00')
  const start = new Date(d); start.setHours(0, 0, 0, 0)
  const end   = new Date(d); end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return toISO(d)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function sliderColor(v: number) {
  if (v <= 3) return 'bg-red-500'
  if (v <= 6) return 'bg-yellow-500'
  return 'bg-green-500'
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HistoricoPage() {
  const [date, setDate] = useState(todayISO())
  const [data, setData] = useState<DayData>({ checkin: null, journal: null, inbox: [], goals: [] })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const today = todayISO()

  const load = useCallback(async (d: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { start, end } = dayBounds(d)

    const [checkinRes, journalRes, inboxRes, goalsRes] = await Promise.all([
      supabase.from('daily_checkin').select('*').eq('user_id', user.id).eq('date', d).maybeSingle(),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('date', d).maybeSingle(),
      supabase.from('inbox_items').select('*').eq('user_id', user.id).gte('created_at', start).lte('created_at', end).order('created_at'),
      supabase.from('goals').select('*').eq('user_id', user.id).gte('created_at', start).lte('created_at', end).order('created_at'),
    ])

    setData({
      checkin: checkinRes.data ?? null,
      journal: journalRes.data ?? null,
      inbox:   inboxRes.data  ?? [],
      goals:   goalsRes.data  ?? [],
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => { load(date) }, [date, load])

  const isEmpty = !data.checkin && !data.journal && data.inbox.length === 0 && data.goals.length === 0
  const isToday  = date === today
  const isFuture = date > today

  function navigate(n: number) {
    const next = addDays(date, n)
    if (next > today) return
    setDate(next)
  }

  // ─── Journal sections ────────────────────────────────────────────────────

  const journalSections = data.journal
    ? data.journal.raw_content.split('\n---\n').map((text, i) => ({
        text,
        label: ['O que aconteceu?', 'Como me senti?', 'O que evitei?'][i] ?? '',
      })).filter(s => s.text.trim())
    : []

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Histórico</h2>
        <p className="text-gray-500 text-sm mt-0.5">Navegue pelo que aconteceu em cada dia</p>
      </div>

      {/* Date navigator */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          ← Anterior
        </button>

        <div className="flex-1 text-center">
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => { if (e.target.value && e.target.value <= today) setDate(e.target.value) }}
            className="bg-transparent text-gray-200 text-sm font-medium text-center focus:outline-none cursor-pointer"
          />
          <p className="text-gray-500 text-xs mt-0.5 capitalize">{formatDate(date)}</p>
        </div>

        <button
          onClick={() => navigate(1)}
          disabled={isToday || isFuture}
          className="text-gray-400 hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:hover:bg-transparent transition-colors text-sm font-medium"
        >
          Próximo →
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-600 text-sm">Carregando...</div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Nenhum registro encontrado neste dia.</p>
          {isToday && (
            <p className="text-xs text-gray-700 mt-1">Use o Cockpit, Diário ou Inbox para começar a registrar.</p>
          )}
        </div>
      )}

      {/* Cockpit */}
      {!loading && data.checkin && (
        <section className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">⚡ Cockpit</h3>
          </div>
          <div className="p-5 space-y-4">

            {data.checkin.mission && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Missão do dia</p>
                <p className="text-gray-200 text-sm font-medium">"{data.checkin.mission}"</p>
              </div>
            )}

            {/* Sliders summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SLIDERS.map(({ key, label, emoji }) => {
                const val = data.checkin![key as keyof Checkin] as number
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-gray-500 mb-1">{emoji}</p>
                    <div className="flex items-end justify-center gap-0.5 h-8">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-sm transition-all ${i < val ? sliderColor(val) : 'bg-gray-800'}`}
                          style={{ height: `${(i + 1) * 10}%` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{val}</p>
                    <p className="text-xs text-gray-600">{label}</p>
                  </div>
                )
              })}
            </div>

            {/* Day blocks */}
            {(data.checkin.bloco_manha || data.checkin.bloco_tarde || data.checkin.bloco_noite) && (
              <div className="space-y-2 pt-1">
                {[
                  { key: 'bloco_manha', label: '🌅 Manhã' },
                  { key: 'bloco_tarde', label: '☀️ Tarde' },
                  { key: 'bloco_noite', label: '🌙 Noite' },
                ].map(({ key, label }) => {
                  const text = data.checkin![key as keyof Checkin] as string
                  if (!text) return null
                  return (
                    <div key={key}>
                      <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                      <p className="text-gray-300 text-sm">{text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Diário */}
      {!loading && data.journal && (
        <section className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">📖 Diário</h3>
            {data.journal.mode === 'poetico' && data.journal.poetic_content && (
              <span className="text-xs text-indigo-400">✨ versão poética disponível</span>
            )}
          </div>
          <div className="p-5 space-y-4">
            {journalSections.map((s, i) => (
              <div key={i}>
                <p className="text-xs text-gray-600 mb-1">{s.label}</p>
                <p className="text-gray-300 text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}

            {data.journal.mode === 'poetico' && data.journal.poetic_content && (
              <div className="bg-gray-800/50 border border-indigo-900/30 rounded-xl p-4">
                <p className="text-xs text-indigo-400 mb-2">Versão poética</p>
                <p className="text-gray-300 text-sm leading-relaxed italic whitespace-pre-wrap">
                  {data.journal.poetic_content}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inbox */}
      {!loading && data.inbox.length > 0 && (
        <section className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              🧠 Inbox capturado ({data.inbox.length})
            </h3>
          </div>
          <div className="p-5 space-y-2">
            {data.inbox.map(item => {
              const cat = INBOX_CAT[item.category]
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${cat.color}`}>
                    {cat.emoji} {cat.label}
                  </span>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.content}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Metas criadas */}
      {!loading && data.goals.length > 0 && (
        <section className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              🎯 Metas criadas ({data.goals.length})
            </h3>
          </div>
          <div className="p-5 space-y-3">
            {data.goals.map(goal => {
              const st = GOAL_STATUS[goal.status] ?? { label: goal.status, color: 'text-gray-500 border-gray-700' }
              return (
                <div key={goal.id} className="flex items-start gap-3">
                  <span className="text-base">{AREAS[goal.area] ?? '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm font-medium">{goal.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs border px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      <span className="text-xs text-gray-600">{goal.progress}% concluído</span>
                      <span className="text-xs text-gray-600">· {goal.deadline_days} dias</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}
