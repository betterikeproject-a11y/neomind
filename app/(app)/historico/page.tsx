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

type Movie = {
  id: string
  title: string
  director: string
  year: number | null
  rating: number | null
  notes: string
}

type MusicLog = {
  id: string
  artist: string
  album: string
  track: string
  genre: string
  rating: number | null
}

type Book = {
  id: string
  title: string
  author: string
  finished_at: string | null
  rating: number | null
}

type DayData = {
  checkin: Checkin | null
  journal: JournalEntry | null
  inbox: InboxItem[]
  goals: Goal[]
  movies: Movie[]
  music: MusicLog[]
  booksFinished: Book[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const card   = 'bg-[#252529] rounded-2xl p-5'
const inp    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const tarea  = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const sel    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const cta    = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
const lbl    = 'text-sm text-[#88889a] mb-2 block'
const div_   = 'border-t border-[rgba(255,255,255,0.07)]'

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
  const [data, setData] = useState<DayData>({ checkin: null, journal: null, inbox: [], goals: [], movies: [], music: [], booksFinished: [] })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const today = todayISO()

  const load = useCallback(async (d: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { start, end } = dayBounds(d)

    const [checkinRes, journalRes, inboxRes, goalsRes, moviesRes, musicRes, booksRes] = await Promise.all([
      supabase.from('daily_checkin').select('*').eq('user_id', user.id).eq('date', d).maybeSingle(),
      supabase.from('journal_entries').select('*').eq('user_id', user.id).eq('date', d).maybeSingle(),
      supabase.from('inbox_items').select('*').eq('user_id', user.id).gte('created_at', start).lte('created_at', end).order('created_at'),
      supabase.from('goals').select('*').eq('user_id', user.id).gte('created_at', start).lte('created_at', end).order('created_at'),
      supabase.from('movies').select('*').eq('user_id', user.id).eq('watched_at', d).order('created_at'),
      supabase.from('music_logs').select('*').eq('user_id', user.id).eq('listened_at', d).order('created_at'),
      supabase.from('books').select('*').eq('user_id', user.id).eq('finished_at', d).order('created_at'),
    ])

    setData({
      checkin:       checkinRes.data  ?? null,
      journal:       journalRes.data  ?? null,
      inbox:         inboxRes.data    ?? [],
      goals:         goalsRes.data    ?? [],
      movies:        moviesRes.data   ?? [],
      music:         musicRes.data    ?? [],
      booksFinished: booksRes.data    ?? [],
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => { load(date) }, [date, load])

  const isEmpty = !data.checkin && !data.journal && data.inbox.length === 0 && data.goals.length === 0 && data.movies.length === 0 && data.music.length === 0 && data.booksFinished.length === 0
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
        <h2 className="text-3xl font-bold text-[#f0f0f5]">Histórico</h2>
        <p className="text-[#88889a] text-sm mt-1">Navegue pelo que aconteceu em cada dia</p>
      </div>

      {/* Date navigator */}
      <div className={`${card} flex items-center gap-3`}>
        <button
          onClick={() => navigate(-1)}
          className="text-[#88889a] hover:text-[#f0f0f5] px-3 py-1.5 rounded-xl hover:bg-[#2d2d33] transition-colors text-sm font-medium"
        >
          ← Anterior
        </button>

        <div className="flex-1 text-center">
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => { if (e.target.value && e.target.value <= today) setDate(e.target.value) }}
            className="bg-transparent text-[#f0f0f5] text-sm font-medium text-center focus:outline-none cursor-pointer"
          />
          <p className="text-[#88889a] text-xs mt-0.5 capitalize">{formatDate(date)}</p>
        </div>

        <button
          onClick={() => navigate(1)}
          disabled={isToday || isFuture}
          className="text-[#88889a] hover:text-[#f0f0f5] disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl hover:bg-[#2d2d33] disabled:hover:bg-transparent transition-colors text-sm font-medium"
        >
          Próximo →
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-[#4a4a5a] text-sm">Carregando...</div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Nenhum registro encontrado neste dia.</p>
          {isToday && (
            <p className="text-xs text-[#4a4a5a] mt-1">Use o Cockpit, Diário ou Inbox para começar a registrar.</p>
          )}
        </div>
      )}

      {/* Cockpit */}
      {!loading && data.checkin && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">⚡ Cockpit</h3>
          </div>
          <div className={`${div_} pt-4 space-y-4`}>

            {data.checkin.mission && (
              <div>
                <p className="text-xs text-[#4a4a5a] mb-1">Missão do dia</p>
                <p className="text-[#f0f0f5] text-sm font-medium">"{data.checkin.mission}"</p>
              </div>
            )}

            {/* Sliders summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SLIDERS.map(({ key, label, emoji }) => {
                const val = data.checkin![key as keyof Checkin] as number
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-[#88889a] mb-1">{emoji}</p>
                    <div className="flex items-end justify-center gap-0.5 h-8">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-sm transition-all ${i < val ? sliderColor(val) : 'bg-[#2d2d33]'}`}
                          style={{ height: `${(i + 1) * 10}%` }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-[#88889a] mt-1 font-medium">{val}</p>
                    <p className="text-xs text-[#4a4a5a]">{label}</p>
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
                      <p className="text-xs text-[#4a4a5a] mb-0.5">{label}</p>
                      <p className="text-[#f0f0f5] text-sm">{text}</p>
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
        <section className={card}>
          <div className="pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">📖 Diário</h3>
            {data.journal.mode === 'poetico' && data.journal.poetic_content && (
              <span className="text-xs text-[#5b94d6]">✨ versão poética disponível</span>
            )}
          </div>
          <div className={`${div_} pt-4 space-y-4`}>
            {journalSections.map((s, i) => (
              <div key={i}>
                <p className="text-xs text-[#4a4a5a] mb-1">{s.label}</p>
                <p className="text-[#f0f0f5] text-sm leading-relaxed">{s.text}</p>
              </div>
            ))}

            {data.journal.mode === 'poetico' && data.journal.poetic_content && (
              <div className="bg-[#2d2d33] rounded-xl p-4">
                <p className="text-xs text-[#5b94d6] mb-2">Versão poética</p>
                <p className="text-[#f0f0f5] text-sm leading-relaxed italic whitespace-pre-wrap">
                  {data.journal.poetic_content}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Inbox */}
      {!loading && data.inbox.length > 0 && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">
              🧠 Inbox capturado ({data.inbox.length})
            </h3>
          </div>
          <div className={`${div_} pt-4 space-y-3`}>
            {data.inbox.map((item, idx) => {
              const cat = INBOX_CAT[item.category]
              return (
                <div key={item.id}>
                  {idx > 0 && <div className={`${div_} mb-3`} />}
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${cat.color}`}>
                      {cat.emoji} {cat.label}
                    </span>
                    <p className="text-[#f0f0f5] text-sm leading-relaxed">{item.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Metas criadas */}
      {!loading && data.goals.length > 0 && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">
              🎯 Metas criadas ({data.goals.length})
            </h3>
          </div>
          <div className={`${div_} pt-4 space-y-3`}>
            {data.goals.map((goal, idx) => {
              const st = GOAL_STATUS[goal.status] ?? { label: goal.status, color: 'text-gray-500 border-gray-700' }
              return (
                <div key={goal.id}>
                  {idx > 0 && <div className={`${div_} mb-3`} />}
                  <div className="flex items-start gap-3">
                    <span className="text-base">{AREAS[goal.area] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f0f0f5] text-sm font-medium">{goal.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs border px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-[#4a4a5a]">{goal.progress}% concluído</span>
                        <span className="text-xs text-[#4a4a5a]">· {goal.deadline_days} dias</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Filmes assistidos */}
      {!loading && data.movies.length > 0 && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">
              🎬 Filmes assistidos ({data.movies.length})
            </h3>
          </div>
          <div className={`${div_} pt-4 space-y-3`}>
            {data.movies.map((m, idx) => (
              <div key={m.id}>
                {idx > 0 && <div className={`${div_} mb-3`} />}
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🎬</span>
                  <div>
                    <p className="text-[#f0f0f5] text-sm font-medium">
                      {m.title}
                      {m.year && <span className="text-[#88889a] font-normal ml-1.5">({m.year})</span>}
                    </p>
                    {m.director && <p className="text-[#88889a] text-xs">dir. {m.director}</p>}
                    {m.rating && (
                      <p className="text-[#5b94d6] text-xs mt-0.5">{'★'.repeat(m.rating)}{'☆'.repeat(5 - m.rating)}</p>
                    )}
                    {m.notes && <p className="text-[#88889a] text-sm mt-1">{m.notes}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Músicas ouvidas */}
      {!loading && data.music.length > 0 && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">
              🎵 Músicas ouvidas ({data.music.length})
            </h3>
          </div>
          <div className={`${div_} pt-4 space-y-3`}>
            {data.music.map((l, idx) => (
              <div key={l.id}>
                {idx > 0 && <div className={`${div_} mb-3`} />}
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">🎵</span>
                  <div>
                    <p className="text-[#f0f0f5] text-sm font-medium">{l.artist}</p>
                    {(l.album || l.track) && (
                      <p className="text-[#88889a] text-xs">{[l.album, l.track].filter(Boolean).join(' · ')}</p>
                    )}
                    {l.genre && (
                      <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-[#1f2d45] text-[#5b94d6] mt-1">{l.genre}</span>
                    )}
                    {l.rating && (
                      <p className="text-[#5b94d6] text-xs mt-0.5">{'★'.repeat(l.rating)}{'☆'.repeat(5 - l.rating)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Livros terminados */}
      {!loading && data.booksFinished.length > 0 && (
        <section className={card}>
          <div className="pb-3 mb-4">
            <h3 className="text-xs font-semibold text-[#88889a] uppercase tracking-wider">
              📚 Livros terminados ({data.booksFinished.length})
            </h3>
          </div>
          <div className={`${div_} pt-4 space-y-3`}>
            {data.booksFinished.map((b, idx) => (
              <div key={b.id}>
                {idx > 0 && <div className={`${div_} mb-3`} />}
                <div className="flex items-start gap-3">
                  <span className="text-base shrink-0">📚</span>
                  <div>
                    <p className="text-[#f0f0f5] text-sm font-medium">{b.title}</p>
                    {b.author && <p className="text-[#88889a] text-xs">por {b.author}</p>}
                    {b.rating && (
                      <p className="text-[#5b94d6] text-xs mt-0.5">{'★'.repeat(b.rating)}{'☆'.repeat(5 - b.rating)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
