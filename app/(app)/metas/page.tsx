'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Area = 'trabalho' | 'mente' | 'corpo' | 'dinheiro' | 'social'
type Status = 'feito' | 'avancou' | 'travou' | 'abandonei'
type DeadlineDays = 14 | 30 | 90

type Goal = {
  id: string
  title: string
  area: Area
  deadline_days: DeadlineDays
  status: Status
  contingency: string
  progress: number
  created_at: string
}

const AREAS: { value: Area; label: string; emoji: string }[] = [
  { value: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { value: 'mente', label: 'Mente', emoji: '🧠' },
  { value: 'corpo', label: 'Corpo', emoji: '💪' },
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💰' },
  { value: 'social', label: 'Social', emoji: '🤝' },
]

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: 'feito', label: 'Feito', color: 'text-green-400 bg-green-950/40 border-green-800/50' },
  { value: 'avancou', label: 'Avançou', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  { value: 'travou', label: 'Travou', color: 'text-orange-400 bg-orange-950/40 border-orange-800/50' },
  { value: 'abandonei', label: 'Abandonei', color: 'text-gray-500 bg-gray-800/40 border-gray-700/50' },
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
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
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

    setForm(defaultForm)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
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
    setForm({
      title: goal.title, area: goal.area, deadline_days: goal.deadline_days,
      status: goal.status, contingency: goal.contingency, progress: goal.progress,
    })
    setEditId(goal.id)
    setShowForm(true)
  }

  const getArea = (v: Area) => AREAS.find(a => a.value === v)!

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Metas</h2>
          <p className="text-gray-500 text-sm mt-0.5">{goals.length} meta{goals.length !== 1 ? 's' : ''} ativa{goals.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm) }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nova meta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">{editId ? 'Editar meta' : 'Nova meta'}</h3>

          <input
            type="text"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Título da meta"
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Área</label>
              <select
                value={form.area}
                onChange={e => setForm(p => ({ ...p, area: e.target.value as Area }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                {AREAS.map(a => <option key={a.value} value={a.value}>{a.emoji} {a.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Prazo</label>
              <select
                value={form.deadline_days}
                onChange={e => setForm(p => ({ ...p, deadline_days: Number(e.target.value) as DeadlineDays }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={90}>90 dias</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Se travar, faço o quê?</label>
            <textarea
              value={form.contingency}
              onChange={e => setForm(p => ({ ...p, contingency: e.target.value }))}
              rows={2}
              placeholder="Plano de contingência..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Criar meta'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {goals.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">Nenhuma meta criada ainda</div>
        )}
        {goals.map(goal => {
          const area = getArea(goal.area)
          return (
            <div key={goal.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{area.emoji} {area.label}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">{goal.deadline_days} dias</span>
                  </div>
                  <h4 className="text-gray-100 font-medium mt-1">{goal.title}</h4>
                  {goal.contingency && (
                    <p className="text-gray-500 text-xs mt-1">🔄 {goal.contingency}</p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => startEdit(goal)} className="text-gray-600 hover:text-gray-300 text-sm px-2 py-1 rounded transition-colors">✏️</button>
                  <button onClick={() => handleDelete(goal.id)} className="text-gray-600 hover:text-red-400 text-sm px-2 py-1 rounded transition-colors">🗑️</button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Progresso</span>
                  <span className="text-xs text-gray-400 font-medium">{goal.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={goal.progress}
                  onChange={e => handleProgressUpdate(goal.id, Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="mt-1.5 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="flex gap-1.5 flex-wrap">
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusUpdate(goal.id, s.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      goal.status === s.value ? s.color : 'text-gray-600 border-gray-800 hover:border-gray-700'
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
