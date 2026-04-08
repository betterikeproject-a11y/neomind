export const dynamic = 'force-dynamic'

import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      <main className="md:ml-56 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
