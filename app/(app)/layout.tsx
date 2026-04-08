export const dynamic = 'force-dynamic'

import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nm-bg">
      <Sidebar />
      {/* pb-20 = space for mobile bottom tab bar, md:ml-60 = desktop sidebar */}
      <main className="md:ml-60 pb-24 md:pb-0 min-h-screen">
        <div className="max-w-2xl mx-auto px-5 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
