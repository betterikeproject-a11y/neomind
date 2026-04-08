'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Design constants ─────────────────────────────────────────────────────────
const card  = 'bg-[#252529] rounded-2xl p-5'
const inp   = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const tarea = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const cta   = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
const lbl   = 'text-sm text-[#88889a] mb-3 block'
// ─────────────────────────────────────────────────────────────────────────────

type Area = 'trabalho' | 'mente' | 'corpo' | 'dinheiro' | 'social'
type Status = 'feito' | 'avancou' | 'travou' | 'abandonei'
type DeadlineDays = 14 | 30 | 90

type Goal = {
  id: string; title: string; area: Area; deadline_days: DeadlineDays
  status: Status; contingency: string; progress: number; created_at: string
}

const AREAS: { value: Area; label: string; emoji: string }[] = [
  { value: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { value: 'mente',    label: 'Mente',    emoji: '🧠' },
  { value: 'corpo',    label: 'Corpo',    emoji: '💪' },
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💰' },
  { value: 'social',   label: 'Social',   emoji: '🤝' },
]

const STATUSES: { value: Status; label: string; color: string; dim: string }[] = [
  { value: 'feito',     label: 'Feito',    color: 'text-[#5bd68a]', dim: 'bg-[#1f2d24]' },
  { value: 'avancou',   label: 'Avançou',  color: 'text-[#5b94d6]', dim: 'bg-[#1f2d45]' },
  { value: 'travou',    label: 'Travou',   color: 'text-[#d6a35b]', dim: 'bg-[#2d2419]' },
  { value: 'abandonei', label: 'Abandonei',color: 'text-[#88889a]', dim: 'bg-[#25252a]' },
]

const defaultForm = {
  title: '', area: 'trabalho' as Area, deadline_days: 30 as DeadlineDays,
  status: 'avancou' as Status, contingency: '', progress: 0,
}

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [form, setForm] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setGoals(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (editId) {
      const { data } = await supabase.from('goals').update(form).eq('id', editId).select().single()
      if (data) setGoals(prev => prev.map(g => g.id === editId ? data : g))
    } else {
      const { data } = await supabase.from('goals').insert({ ...form, user_id: user.id }).select().single()
      if (data) setGoals(prev => [data, ...prev])
    }
    setForm(defaultForm); setShowForm(false); setEditId(null); setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function handleProgressUpdate(id: string, progress: number) {
    await supabase.from('goals').update({ progress }).eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress } : g))
  }

  async function handleStatusUpdate(id: string, status: Status) {
    await supabase.from('goals').update({ status }).eq('id', id)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status } : g))
  }

  function startEdit(goal: Goal) {
    setForm({ title: goal.title, area: goal.area, deadline_days: goal.deadline_days,
      status: goal.status, contingency: goal.contingency, progress: goal.progress })
    setEditId(goal.id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getArea   = (v: Area)   => AREAS.find(a => a.value === v)!
  const getStatus = (v: Status) => STATUSES.find(s => s.value === v)!

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#f0f0f5]">Metas</h2>
          <p className="text-[#88889a] text-sm mt-1">{goals.length} meta{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm) }}
          className="bg-[#252529] text-[#5b94d6] text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-[#2d2d33]"
        >
          {showForm ? 'Cancelar' : '+ Nova meta'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={card + ' space-y-5'}>
          <div>
            <label className={lbl}>Título *</label>
            <input type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Qual é a sua meta?"
              className={inp}
            />
          </div>

          {/* Area — radio style */}
          <div>
            <label className={lbl}>Em qual área?</label>
            <div className={`bg-[#2d2d33] rounded-xl overflow-hidden divide-y divide-[rgba(255,255,255,0.06)]`}>
              {AREAS.map(a => (
                <button
                  key={a.value} type="button"
                  onClick={() => setForm(p => ({ ...p, area: a.value }))}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#33333d]"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    form.area === a.value ? 'border-[#5b94d6]' : 'border-[#4a4a5a]'
                  }`}>
                    {form.area === a.value && <div className="w-2 h-2 rounded-full bg-[#5b94d6]" />}
                  </div>
                  <span className={`text-sm ${form.area === a.value ? 'text-[#f0f0f5]' : 'text-[#88889a]'}`}>
                    {a.emoji} {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline — pill buttons */}
          <div>
            <label className={lbl}>Prazo:</label>
            <div className="flex gap-2">
              {([14, 30, 90] as DeadlineDays[]).map(d => (
                <button
                  key={d} type="button"
                  onClick={() => setForm(p => ({ ...p, deadline_days: d }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    form.deadline_days === d
                      ? 'bg-[#1f2d45] text-[#5b94d6]'
                      : 'bg-[#2d2d33] text-[#88889a] hover:text-[#f0f0f5]'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>
          </div>

          {/* Contingency */}
          <div>
            <label className={lbl}>Se travar, faço o quê?</label>
            <textarea
              value={form.contingency}
              onChange={e => setForm(p => ({ ...p, contingency: e.target.value }))}
              rows={2} placeholder="Plano de contingência..."
              className={tarea}
            />
          </div>

          <button type="submit" disabled={saving} className={cta}>
            {saving ? 'Salvando...' : editId ? 'Atualizar meta' : 'Criar meta'}
          </button>
        </form>
      )}

      {/* List */}
      {goals.length === 0 && !showForm && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-sm">Nenhuma meta criada ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {goals.map(goal => {
          const area   = getArea(goal.area)
          const status = getStatus(goal.status)
          return (
            <div key={goal.id} className={card + ' space-y-4'}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[#88889a]">{area.emoji} {area.label}</span>
                    <span className="text-[#4a4a5a] text-xs">·</span>
                    <span className="text-xs text-[#88889a]">{goal.deadline_days} dias</span>
                  </div>
                  <h4 className="text-[#f0f0f5] font-medium">{goal.title}</h4>
                  {goal.contingency && (
                    <p className="text-[#4a4a5a] text-xs mt-1">🔄 {goal.contingency}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(goal)}
                    className="text-[#4a4a5a] hover:text-[#88889a] px-2 py-1 rounded-lg transition-colors text-sm">✏️</button>
                  <button onClick={() => handleDelete(goal.id)}
                    className="text-[#4a4a5a] hover:text-[#d66b5b] px-2 py-1 rounded-lg transition-colors text-sm">🗑️</button>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-[#88889a]">Progresso</span>
                  <span className="text-xs text-[#5b94d6] font-medium">{goal.progress}%</span>
                </div>
                <input type="range" min={0} max={100} value={goal.progress}
                  onChange={e => handleProgressUpdate(goal.id, Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 h-1 bg-[#2d2d33] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5b94d6] rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>

              {/* Status */}
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusUpdate(goal.id, s.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      goal.status === s.value
                        ? `${s.dim} ${s.color}`
                        : 'bg-[#2d2d33] text-[#4a4a5a] hover:text-[#88889a]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
