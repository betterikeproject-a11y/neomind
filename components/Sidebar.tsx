'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const mainTabs = [
  { href: '/cockpit',   label: 'Cockpit',  icon: '⚡' },
  { href: '/inbox',     label: 'Inbox',    icon: '🧠' },
  { href: '/metas',     label: 'Metas',    icon: '🎯' },
  { href: '/diario',    label: 'Diário',   icon: '📖' },
  { href: '/historico', label: 'Histórico',icon: '🗓️' },
]

type NavGroup = { label?: string; items: { href: string; label: string; icon: string }[] }

const navGroups: NavGroup[] = [
  {
    items: [
      { href: '/cockpit',   label: 'Cockpit',      icon: '⚡' },
      { href: '/inbox',     label: 'Inbox Mental', icon: '🧠' },
      { href: '/diario',    label: 'Diário',       icon: '📖' },
      { href: '/metas',     label: 'Metas',        icon: '🎯' },
      { href: '/projetos',  label: 'Projetos',     icon: '📁' },
    ],
  },
  {
    label: 'Registro',
    items: [
      { href: '/filmes',  label: 'Filmes',  icon: '🎬' },
      { href: '/musicas', label: 'Músicas', icon: '🎵' },
      { href: '/livros',  label: 'Livros',  icon: '📚' },
    ],
  },
  {
    label: 'Tempo',
    items: [
      { href: '/historico', label: 'Histórico', icon: '🗓️' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* ── Mobile: bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1f1f24] border-t border-[rgba(255,255,255,0.07)] px-2 pb-safe">
        <div className="flex">
          {mainTabs.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
                  active ? 'text-nm-blue' : 'text-nm-faint'
                }`}
              >
                <span className="text-xl leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop: left sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-[#1f1f24] border-r border-[rgba(255,255,255,0.05)] z-40 overflow-y-auto">
        <div className="px-6 py-7">
          <h1 className="text-lg font-bold text-nm-text tracking-tight">NeoMind</h1>
          <p className="text-nm-faint text-xs mt-0.5">cockpit mental</p>
        </div>

        <nav className="flex-1 px-3 space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold text-nm-faint uppercase tracking-widest px-3 mb-1.5">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        active
                          ? 'bg-nm-blue-dim text-nm-blue'
                          : 'text-nm-muted hover:text-nm-text hover:bg-[#252529]'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-3 border-t border-[rgba(255,255,255,0.05)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-nm-faint hover:text-nm-muted hover:bg-[#252529] transition-colors"
          >
            <span className="text-base">🚪</span>
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
