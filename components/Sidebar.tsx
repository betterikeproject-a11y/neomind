'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/cockpit',   label: 'Cockpit',      icon: '⚡' },
  { href: '/inbox',     label: 'Inbox Mental', icon: '🧠' },
  { href: '/metas',     label: 'Metas',        icon: '🎯' },
  { href: '/diario',    label: 'Diário',       icon: '📖' },
  { href: '/historico', label: 'Histórico',    icon: '🗓️' },
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
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="text-indigo-400 font-bold text-lg">NeoMind</span>
        <nav className="flex gap-4">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xl ${pathname === item.href ? 'opacity-100' : 'opacity-40'}`}
              title={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-gray-900 border-r border-gray-800 z-40">
        <div className="px-5 py-6">
          <h1 className="text-xl font-bold text-indigo-400 tracking-tight">NeoMind</h1>
          <p className="text-gray-600 text-xs mt-0.5">cockpit mental</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-600/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <span className="text-base">🚪</span>
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
