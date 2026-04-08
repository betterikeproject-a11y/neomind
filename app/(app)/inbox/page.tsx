'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = 'ideia' | 'resolver' | 'incomoda'
type InboxItem = { id: string; content: string; category: Category; created_at: string }

const CATEGORIES: { value: Category; label: string; emoji: string; color: string }[] = [
  { value: 'ideia', label: 'Ideia', emoji: '💡', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/50' },
  { value: 'resolver', label: 'Resolver', emoji: '🔧', color: 'text-blue-400 bg-blue-950/40 border-blue-800/50' },
  { value: 'incomoda', label: 'Incomoda', emoji: '😤', color: 'text-red-400 bg-red-950/40 border-red-800/50' },
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
      .from('inbox_items')
      .select('*')
      .eq('user_id', user.id)
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
      .select()
      .single()
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Inbox Mental</h2>
        <p className="text-gray-500 text-sm mt-0.5">Capture o caos antes que some</p>
      </div>

      {/* Capture form */}
      <form onSubmit={handleCapture} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-3">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          placeholder="O que está na sua cabeça agora?"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
        />
        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  category === cat.value
                    ? cat.color
                    : 'text-gray-500 border-gray-700 hover:border-gray-600'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Capturar
          </button>
        </div>
      </form>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            filter === 'all' ? 'text-gray-100 bg-gray-700 border-gray-600' : 'text-gray-500 border-gray-800 hover:border-gray-700'
          }`}
        >
          Todos ({items.length})
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === cat.value ? cat.color : 'text-gray-500 border-gray-800 hover:border-gray-700'
            }`}
          >
            {cat.emoji} {items.filter(i => i.category === cat.value).length}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">
            Nenhum item capturado ainda
          </div>
        )}
        {filtered.map(item => {
          const cat = getCat(item.category)
          return (
            <div key={item.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-start gap-3 group">
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 text-sm leading-relaxed">{item.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cat.color}`}>
                    {cat.emoji} {cat.label}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none mt-0.5 shrink-0"
                title="Deletar"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
