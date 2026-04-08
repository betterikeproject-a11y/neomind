'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Design constants ─────────────────────────────────────────────────────────
const card  = 'bg-[#252529] rounded-2xl p-5'
const tarea = 'w-full bg-transparent text-[#f0f0f5] text-base placeholder-[#4a4a5a] outline-none border-0 resize-none leading-relaxed'
const cta   = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
// ─────────────────────────────────────────────────────────────────────────────

type Category = 'ideia' | 'resolver' | 'incomoda'
type InboxItem = { id: string; content: string; category: Category; created_at: string }

const CATEGORIES: { value: Category; label: string; emoji: string; color: string; dim: string }[] = [
  { value: 'ideia',    label: 'Ideia',   emoji: '💡', color: 'text-[#e8b84b]', dim: 'bg-[#2d2a1f]' },
  { value: 'resolver', label: 'Resolver',emoji: '🔧', color: 'text-[#5b94d6]', dim: 'bg-[#1f2d45]' },
  { value: 'incomoda', label: 'Incomoda',emoji: '😤', color: 'text-[#d66b5b]', dim: 'bg-[#2d1f1f]' },
]

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<Category>('ideia')
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('inbox_items').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setItems(data)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('inbox_items')
      .insert({ user_id: user.id, content: content.trim(), category })
      .select().single()
    if (data) setItems(prev => [data, ...prev])
    setContent('')
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('inbox_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.category === filter)
  const getCat = (v: Category) => CATEGORIES.find(c => c.value === v)!

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-[#f0f0f5]">Inbox</h2>
        <p className="text-[#88889a] text-sm mt-1">Tire da cabeça. Organize depois.</p>
      </div>

      {/* Capture */}
      <form onSubmit={handleCapture} className={card + ' space-y-4'}>
        <div className="border-b border-[rgba(255,255,255,0.07)] pb-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="O que está ocupando sua mente?"
            className={tarea}
          />
          <p className="text-[#4a4a5a] text-xs mt-1">Ideia, medo, tarefa, qualquer coisa</p>
        </div>

        {/* Category selector */}
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value} type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                category === cat.value
                  ? `${cat.dim} ${cat.color}`
                  : 'bg-[#2d2d33] text-[#4a4a5a] hover:text-[#88889a]'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <button type="submit" disabled={loading || !content.trim()} className={cta}>
          {loading ? 'Capturando...' : 'Capturar'}
        </button>
      </form>

      {/* Filter */}
      {items.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === 'all' ? 'bg-[#252529] text-[#f0f0f5]' : 'text-[#4a4a5a] hover:text-[#88889a]'
            }`}
          >
            Todos ({items.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === cat.value
                  ? `${cat.dim} ${cat.color}`
                  : 'text-[#4a4a5a] hover:text-[#88889a]'
              }`}
            >
              {cat.emoji} {items.filter(i => i.category === cat.value).length}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 && items.length === 0 && (
        <div className="text-center py-16 text-[#4a4a5a]">
          <p className="text-4xl mb-3">🧠</p>
          <p className="text-sm">Nenhum item capturado ainda</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className={card + ' divide-y divide-[rgba(255,255,255,0.07)] p-0 overflow-hidden'}>
          {filtered.map(item => {
            const cat = getCat(item.category)
            return (
              <div key={item.id} className="flex items-start gap-3 px-5 py-4 group">
                <div className="flex-1 min-w-0">
                  <p className="text-[#f0f0f5] text-sm leading-relaxed">{item.content}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs font-medium ${cat.color}`}>{cat.emoji} {cat.label}</span>
                    <span className="text-[#4a4a5a] text-xs">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[#2d2d33] hover:text-[#d66b5b] transition-colors opacity-0 group-hover:opacity-100 text-xl leading-none shrink-0 mt-0.5"
                >×</button>
              </div>
            )
          })}
        </div>
      )}

      {items.length > 0 && (
        <p className="text-[#88889a] text-sm text-center pb-2">
          Você tem {items.length} item{items.length !== 1 ? 's' : ''} na mente.
        </p>
      )}
    </div>
  )
}
