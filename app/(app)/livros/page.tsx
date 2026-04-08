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
          <h2 className="text-2xl font-bold text-gray-100">Livros</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {lendo.length > 0 && `${lendo.length} lendo · `}{lidos.length} lido{lidos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Adicionar livro'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-gray-400">Adicionar livro</h3>

          <div>
            <label className={labelClass}>Título *</label>
            <input
              type="text" required value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Título do livro"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Autor</label>
              <input
                type="text" value={form.author}
                onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                placeholder="Nome do autor"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ano de publicação</label>
              <input
                type="number" value={form.year} min={1000} max={new Date().getFullYear() + 2}
                onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                placeholder="ex: 1984"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Comecei a ler em</label>
              <input
                type="date" value={form.started_at}
                onChange={e => setForm(p => ({ ...p, started_at: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Terminei em (opcional)</label>
              <input
                type="date" value={form.finished_at} min={form.started_at}
                onChange={e => setForm(p => ({ ...p, finished_at: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Avaliação</label>
            <Stars value={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>

          <div>
            <label className={labelClass}>Notas / impressões</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3} placeholder="O que aprendi, o que me marcou..."
              className={inputClass + ' resize-none'}
            />
          </div>

          <button
            type="submit" disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === tab.value ? 'text-gray-100 bg-gray-700 border-gray-600' : 'text-gray-500 border-gray-800 hover:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {books.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-sm">Nenhum livro adicionado ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(b => {
          const isReading = !!b.started_at && !b.finished_at
          return (
            <div key={b.id} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5 shrink-0">📚</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-gray-100 font-medium">
                        {b.title}
                        {b.year && <span className="text-gray-500 text-sm font-normal ml-2">({b.year})</span>}
                      </p>
                      {b.author && <p className="text-gray-500 text-sm">por {b.author}</p>}
                    </div>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                    >×</button>
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {isReading ? (
                      <span className="text-xs text-green-400 bg-green-950/40 border border-green-800/50 px-2 py-0.5 rounded-full">Lendo</span>
                    ) : b.finished_at ? (
                      <span className="text-xs text-blue-400 bg-blue-950/40 border border-blue-800/50 px-2 py-0.5 rounded-full">Lido</span>
                    ) : null}
                    <StarDisplay value={b.rating} />
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                    {b.started_at && (
                      <span>Início: {new Date(b.started_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                    {b.finished_at && (
                      <span>· Fim: {new Date(b.finished_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>

                  {b.notes && <p className="text-gray-500 text-sm mt-2 leading-relaxed">{b.notes}</p>}
                </div>
              </div>

              {isReading && (
                <button
                  onClick={() => markFinished(b.id)}
                  className="text-xs text-blue-400 border border-blue-800/50 px-3 py-1.5 rounded-lg hover:bg-blue-950/30 transition-colors"
                >
                  ✓ Marcar como lido
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
