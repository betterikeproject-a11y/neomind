'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const SLIDERS = [
  { key: 'humor', label: 'Humor', emoji: '😊' },
  { key: 'energia', label: 'Energia', emoji: '⚡' },
  { key: 'foco', label: 'Foco', emoji: '🎯' },
  { key: 'ansiedade', label: 'Ansiedade', emoji: '😰' },
  { key: 'sono', label: 'Sono', emoji: '😴' },
  { key: 'clareza', label: 'Clareza', emoji: '💡' },
] as const

type SliderKey = typeof SLIDERS[number]['key']

type Checkin = {
  id?: string
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

const defaultCheckin: Checkin = {
  mission: '',
  humor: 5, energia: 5, foco: 5, ansiedade: 5, sono: 5, clareza: 5,
  bloco_manha: '', bloco_tarde: '', bloco_noite: '',
}

export default function CockpitPage() {
  const [checkin, setCheckin] = useState<Checkin>(defaultCheckin)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [missionAlert, setMissionAlert] = useState(false)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('daily_checkin')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (data) {
      setCheckin(data)
      setMissionAlert(!data.mission)
    } else {
      setMissionAlert(true)
    }
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

    setSaving(false)
    setSaved(true)
    setMissionAlert(!checkin.mission)
    setTimeout(() => setSaved(false), 2000)
  }

  function setSlider(key: SliderKey, value: number) {
    setCheckin(prev => ({ ...prev, [key]: value }))
  }

  const sliderColor = (v: number) => {
    if (v <= 3) return 'accent-red-500'
    if (v <= 6) return 'accent-yellow-500'
    return 'accent-green-500'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Cockpit</h2>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
        </button>
      </div>

      {missionAlert && (
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 text-amber-400 text-sm flex items-center gap-2">
          <span>⚠️</span> Você ainda não definiu sua missão do dia.
        </div>
      )}

      {/* Missão do dia */}
      <section className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Missão do dia</h3>
        <input
          type="text"
          value={checkin.mission}
          onChange={e => setCheckin(prev => ({ ...prev, mission: e.target.value }))}
          placeholder="Uma frase que define o que você quer conquistar hoje..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </section>

      {/* Check-in sliders */}
      <section className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Estado atual</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SLIDERS.map(({ key, label, emoji }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-300">{emoji} {label}</span>
                <span className="text-sm font-bold text-gray-200 w-6 text-right">{checkin[key]}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={checkin[key]}
                onChange={e => setSlider(key, Number(e.target.value))}
                className={`w-full h-1.5 ${sliderColor(checkin[key])}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Dia em blocos */}
      <section className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Dia em blocos</h3>
        <div className="space-y-3">
          {[
            { key: 'bloco_manha', label: '🌅 Manhã' },
            { key: 'bloco_tarde', label: '☀️ Tarde' },
            { key: 'bloco_noite', label: '🌙 Noite' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 mb-1 block">{label}</label>
              <textarea
                value={checkin[key as keyof Checkin] as string}
                onChange={e => setCheckin(prev => ({ ...prev, [key]: e.target.value }))}
                rows={2}
                placeholder={`O que você planeja / fez na ${label.split(' ')[1].toLowerCase()}...`}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
