'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Design constants ─────────────────────────────────────────────────────────
const card  = 'bg-[#252529] rounded-2xl p-5'
const inp   = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0'
const tarea = 'w-full bg-[#2d2d33] rounded-xl px-4 py-3.5 text-[#f0f0f5] text-sm placeholder-[#4a4a5a] outline-none focus:ring-1 focus:ring-[#5b94d6] transition-all border-0 resize-none'
const cta   = 'w-full bg-[#1f2d45] text-[#5b94d6] font-semibold py-4 rounded-xl text-base transition-colors hover:bg-[#243553] disabled:opacity-40'
// ─────────────────────────────────────────────────────────────────────────────

const SLIDERS = [
  { key: 'humor',    label: 'Humor',    emoji: '😊' },
  { key: 'energia',  label: 'Energia',  emoji: '⚡' },
  { key: 'foco',     label: 'Foco',     emoji: '🎯' },
  { key: 'ansiedade',label: 'Ansiedade',emoji: '😰' },
  { key: 'sono',     label: 'Sono',     emoji: '😴' },
  { key: 'clareza',  label: 'Clareza',  emoji: '💡' },
] as const

type SliderKey = typeof SLIDERS[number]['key']

type Checkin = {
  id?: string
  mission: string
  humor: number; energia: number; foco: number
  ansiedade: number; sono: number; clareza: number
  bloco_manha: string; bloco_tarde: string; bloco_noite: string
}

const defaultCheckin: Checkin = {
  mission: '',
  humor: 5, energia: 5, foco: 5, ansiedade: 5, sono: 5, clareza: 5,
  bloco_manha: '', bloco_tarde: '', bloco_noite: '',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia.'
  if (h < 18) return 'Boa tarde.'
  return 'Boa noite.'
}

export default function CockpitPage() {
  const [checkin, setCheckin] = useState<Checkin>(defaultCheckin)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('daily_checkin').select('*')
      .eq('user_id', user.id).eq('date', today).single()
    if (data) setCheckin(data)
  }, [supabase, today])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = { ...checkin, user_id: user.id, date: today }
    if (checkin.id) {
      await supabase.from('daily_checkin').update(payload).eq('id', checkin.id)
    } else {
      const { data } = await supabase.from('daily_checkin').insert(payload).select().single()
      if (data) setCheckin(data)
    }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function setSlider(key: SliderKey, value: number) {
    setCheckin(prev => ({ ...prev, [key]: value }))
  }

  const dateStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-[#88889a] text-sm capitalize">{dateStr}</p>
        <h2 className="text-4xl font-bold text-[#f0f0f5] mt-1">Cockpit Test</h2>
      </div>

      {/* Missão */}
      <div className={card}>
        <p className="text-[#88889a] text-sm mb-3">Hoje sua missão principal é:</p>
        <input
          type="text"
          value={checkin.mission}
          onChange={e => setCheckin(p => ({ ...p, mission: e.target.value }))}
          placeholder="+ Definir missão do dia"
          className={inp}
        />
      </div>

      {/* Estado mental */}
      <div className={card}>
        <p className="text-[#88889a] text-sm mb-4">Estado mental:</p>
        <div className="space-y-4">
          {SLIDERS.map(({ key, label, emoji }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#f0f0f5]">{emoji} {label}</span>
                <span className="text-sm font-semibold text-[#5b94d6] w-6 text-right">{checkin[key]}</span>
              </div>
              <input
                type="range" min={1} max={10}
                value={checkin[key]}
                onChange={e => setSlider(key, Number(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dia em blocos */}
      <div className={card}>
        <p className="text-[#88889a] text-sm mb-4">Dia em blocos:</p>
        <div className="space-y-3">
          {[
            { key: 'bloco_manha', label: '🌅 Manhã',  ph: 'O que você planeja para a manhã...' },
            { key: 'bloco_tarde', label: '☀️ Tarde',  ph: 'O que você planeja para a tarde...' },
            { key: 'bloco_noite', label: '🌙 Noite',  ph: 'O que você planeja para a noite...' },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <p className="text-xs text-[#4a4a5a] mb-1.5">{label}</p>
              <textarea
                value={checkin[key as keyof Checkin] as string}
                onChange={e => setCheckin(p => ({ ...p, [key]: e.target.value }))}
                rows={2} placeholder={ph}
                className={tarea}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button onClick={handleSave} disabled={saving} className={cta}>
        {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar dia'}
      </button>
    </div>
  )
}
