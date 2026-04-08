'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Book = {
  id: string
  title: string
  author: string
  year: number | null
  rating: number | null
  notes: string
  started_at: string | null
  finished_at: string | null
  created_at: string
}

type FilterTab = 'todos' | 'lendo' | 'lidos'

const defaultForm = {
  title: '', author: '', year: '', rating: 0,
  notes: '', started_at: new Date().toISOString().split('T')[0], finished_at: '',
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

export default function LivrosPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [form, setForm] = useState(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('todos')
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setBooks(data)
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
      author: form.author.trim(),
      year: form.year ? Number(form.year) : null,
      rating: form.rating || null,
      notes: form.notes.trim(),
      started_at: form.started_at || null,
      finished_at: form.finished_at || null,
    }

    const { data } = await supabase.from('books').insert(payload).select().single()
    if (data) setBooks(prev => [data, ...prev])

    setForm({ ...defaultForm, started_at: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('books').delete().eq('id', id)
    setBooks(prev => prev.filter(b => b.id !== id))
  }

  async function markFinished(id: string) {
    const finished_at = new Date().toISOString().split('T')[0]
    await supabase.from('books').update({ finished_at }).eq('id', id)
    setBooks(prev => prev.map(b => b.id === id ? { ...b, finished_at } : b))
  }

  const lendo = books.filter(b => b.started_at && !b.finished_at)
  const lidos = books.filter(b => !!b.finished_at)
  const filtered = filter === 'lendo' ? lendo : filter === 'lidos' ? lidos : books

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[#f0f0f5]">Livros</h2>
          <p className="text-[#88889a] text-sm mt-1">
            {lendo.length > 0 && `${lendo.length} lendo · `}{lidos.length} lido{lidos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#252529] text-[#5b94d6] text-sm font-medium px-4 py-2 rounded-xl transition-colors hover:bg-[#2d2d33]"
        >
          {showForm ? 'Cancelar' : '+ Adicionar livro'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
          <h3 className="text-sm font-semibold text-[#88889a]">Adicionar livro</h3>

          <div>
            <label className={lbl}>Título *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Título do livro"
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Autor</label>
              <input
                type="text" value={form.author}
                onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                placeholder="Nome do autor"
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Ano de publicação</label>
              <input
                type="number" value={form.year} min={1000} max={new Date().getFullYear() + 2}
                onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                placeholder="ex: 1984"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Comecei a ler em</label>
              <input
                type="date" value={form.started_at}
                onChange={e => setForm(p => ({ ...p, started_at: e.target.value }))}
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Terminei em (opcional)</label>
              <input
                type="date" value={form.finished_at} min={form.started_at}
                onChange={e => setForm(p => ({ ...p, finished_at: e.target.value }))}
                className={inp}
              />
            </div>
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
              rows={3} placeholder="O que aprendi, o que me marcou..."
              className={tarea}
            />
          </div>

          <button type="submit" disabled={saving} className={cta}>
            {saving ? 'Salvando...' : 'Salvar livro'}
          </button>
        </form>
      )}

      {/* Filter tabs */}
      {books.length > 0 && (
        <div className="flex gap-2">
          {([
            { value: 'todos', label: `Todos (${books.length})` },
            { value: 'lendo', label: `Lendo (${lendo.length})` },
            { value: 'lidos', label: `Lidos (${lidos.length})` },
          ] as { value: FilterTab; label: string }[]).map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                filter === tab.value ? 'bg-[#1f2d45] text-[#5b94d6]' : 'text-[#88889a] bg-[#252529] hover:bg-[#2d2d33]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {books.length === 0 && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">Nenhum livro adicionado ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(b => {
          const isReading = !!b.started_at && !b.finished_at
          return (
            <div key={b.id} className={`${card} space-y-3`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 shrink-0">📚</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[#f0f0f5] font-medium">
                        {b.title}
                        {b.year && <span className="text-[#88889a] text-sm font-normal ml-2">({b.year})</span>}
                      </p>
                      {b.author && <p className="text-[#88889a] text-sm">por {b.author}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-[#4a4a5a] hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                    >×</button>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {isReading ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#1f2d45] text-[#5b94d6]">Lendo</span>
                    ) : b.finished_at ? (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[#2d2d33] text-[#88889a]">Lido</span>
                    ) : null}
                    <StarDisplay value={b.rating} />
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-[#4a4a5a] flex-wrap">
                    {b.started_at && (
                      <span>Início: {new Date(b.started_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                    {b.finished_at && (
                      <span>· Fim: {new Date(b.finished_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>

                  {b.notes && <p className="text-[#88889a] text-sm mt-2 leading-relaxed">{b.notes}</p>}
                </div>
              </div>

              {isReading && (
                <div className={div_}>
                  <button
                    onClick={() => markFinished(b.id)}
                    className="mt-3 text-xs text-[#5b94d6] bg-[#1f2d45] px-3 py-1.5 rounded-xl hover:bg-[#243553] transition-colors"
                  >
                    ✓ Marcar como lido
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
