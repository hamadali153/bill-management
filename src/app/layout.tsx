import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthWrapper from '@/components/AuthWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bill Management System',
  description: 'Office bill management for breakfast, lunch, and dinner',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          <main className="min-h-screen bg-background">
            {children}
          </main>
        </AuthWrapper>
      </body>
    </html>
  )
}
