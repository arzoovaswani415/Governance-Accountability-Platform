import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Sidebar } from '@/components/sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'FairFlow - Governance Transparency Dashboard',
  description: 'Track political promises and policies with transparent governance monitoring',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/* Outer shell — warm gray background */}
      <body className="font-sans antialiased bg-background min-h-screen">
        <div className="flex min-h-screen gap-3 p-3">

          {/* ── Left: Sidebar floating panel ── */}
          <div className="floating-panel flex-shrink-0 w-56 h-[calc(100vh-24px)] sticky top-3 hidden md:flex flex-col">
            <Sidebar />
          </div>

          {/* ── Right: Main content floating panel ── */}
          <div className="floating-panel flex-1 flex flex-col h-[calc(100vh-24px)] overflow-hidden relative explorer-bg">
            <div className="gov-watermark" />
            <main className="flex-1 overflow-y-auto relative z-10">
              {children}
            </main>
          </div>

        </div>
        <Analytics />
      </body>
    </html>
  )
}
