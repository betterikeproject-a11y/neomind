'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'ativo' | 'pausado' | 'concluido' | 'cancelado'
type Area   = 'trabalho' | 'mente' | 'corpo' | 'dinheiro' | 'social' | 'pessoal'

type Project = {
  id: string
  title: string
  description: string
  status: Status
  area: Area | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

const AREAS: { value: Area; label: string; emoji: string }[] = [
  { value: 'trabalho', label: 'Trabalho', emoji: '💼' },
  { value: 'mente',    label: 'Mente',    emoji: '🧠' },
  { value: 'corpo',    label: 'Corpo',    emoji: '💪' },
  { value: 'dinheiro', label: 'Dinheiro', emoji: '💰' },
  { value: 'social',   label: 'Social',   emoji: '🤝' },
  { value: 'pessoal',  label: 'Pessoal',  emoji: '🙋' },
]

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: 'ativo',     label: 'Ativo',     color: 'text-green-400 bg-green-950/40 border-green-800/50' },
  { value: 'pausado',   label: 'Pausado',   color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
  { value: 'concluido', label: 'Concluído', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  { value: 'cancelado', label: 'Cancelado', color: 'text-gray-500 bg-gray-800/40 border-gray-700/50' },
]

const defaultForm = {
  title: '', description: '', status: 'ativo' as Status,
  area: '' as Area | '', started_at: '',
}

const card   = 'bg-[#252529] rounded-2xl p-5'
const inp    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const tarea  = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const sel    = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const cta    = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
const lbl    = 'text-sm text-[#88889a] mb-2 block'
const div_   = 'border-t border-[rgba(255,255,255,0.07)]'

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      area: form.area || null,
      started_at: form.started_at || null,
    }

    if (editId) {
      const { data } = await supabase.from('projects').update(payload).eq('id', editId).select().single()
      if (data) setProjects(prev => prev.map(p => p.id === editId ? data : p))
    } else {
      const { data } = await supabase.from('projects').insert({ ...payload, user_id: user.id }).select().single()
      if (data) setProjects(prev => [data, ...prev])
    }

    setForm(defaultForm)
    setShowForm(false)
    setEditId(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function handleStatusChange(id: string, status: Status) {
    const extra = status === 'concluido' ? { finished_at: new Date().toISOString().split('T')[0] } : {}
    await supabase.from('projects').update({ status, ...extra }).eq('id', id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status, ...extra } : p))
  }

  function startEdit(p: Project) {
    setForm({ title: p.title, description: p.description, status: p.status, area: p.area ?? '', started_at: p.started_at ?? '' })
    setEditId(p.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getArea   = (v: Area | null) => AREAS.find(a => a.value === v)
  const getStatus = (v: Status)      => STATUSES.find(s => s.value === v)!

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#f0f0f5]">Projetos</h2>
          <p className="text-[#88889a] text-sm mt-1">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditId(null); setForm(defaultForm) }}
          className="bg-[#252529] text-[#5b94d6] text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-[#2d2d33]"
        >
          {showForm ? 'Cancelar' : '+ Novo projeto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
          <h3 className="text-sm font-semibold text-[#88889a]">{editId ? 'Editar projeto' : 'Novo projeto'}</h3>

          <div>
            <label className={lbl}>Título *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Nome do projeto"
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Do que se trata este projeto..."
              className={tarea}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Área</label>
              <select value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value as Area | '' }))} className={sel}>
                <option value="">— Sem área —</option>
                {AREAS.map(a => <option key={a.value} value={a.value}>{a.emoji} {a.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))} className={sel}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Data de início</label>
            <input
              type="date" value={form.started_at}
              onChange={e => setForm(p => ({ ...p, started_at: e.target.value }))}
              className={inp}
            />
          </div>

          <button type="submit" disabled={saving} className={cta}>
            {saving ? 'Salvando...' : editId ? 'Atualizar projeto' : 'Salvar projeto'}
          </button>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === 'all' ? 'bg-[#1f2d45] text-[#5b94d6]' : 'text-[#88889a] bg-[#252529] hover:bg-[#2d2d33]'}`}
        >
          Todos ({projects.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === s.value ? `${s.color} border` : 'text-[#88889a] bg-[#252529] hover:bg-[#2d2d33]'}`}
          >
            {s.label} ({projects.filter(p => p.status === s.value).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#4a4a5a] text-sm">Nenhum projeto encontrado</div>
        )}
        {filtered.map(p => {
          const area   = getArea(p.area)
          const status = getStatus(p.status)
          return (
            <div key={p.id} className={`${card} space-y-3`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {area && <span className="text-xs text-[#88889a]">{area.emoji} {area.label}</span>}
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${status.color}`}>{status.label}</span>
                  </div>
                  <h4 className="text-[#f0f0f5] font-medium">{p.title}</h4>
                  {p.description && <p className="text-[#88889a] text-sm mt-1">{p.description}</p>}
                  {p.started_at && (
                    <p className="text-[#4a4a5a] text-xs mt-1">
                      Início: {new Date(p.started_at + 'T12:00:00').toLocaleDateString('pt-BR')}
                      {p.finished_at && ` · Fim: ${new Date(p.finished_at + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => startEdit(p)} className="text-[#4a4a5a] hover:text-[#f0f0f5] px-2 py-1 rounded transition-colors text-sm">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="text-[#4a4a5a] hover:text-red-400 px-2 py-1 rounded transition-colors text-sm">🗑️</button>
                </div>
              </div>

              {/* Status quick-change */}
              <div className={`${div_} pt-3 flex gap-1.5 flex-wrap`}>
                {STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(p.id, s.value)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-colors ${p.status === s.value ? s.color : 'text-[#4a4a5a] border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]'}`}
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
