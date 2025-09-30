import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import '@/styles/mobile-dashboard.css'
import UniversalMobileInjector from '@/components/mobile/universal-mobile-injector'

export const metadata: Metadata = {
  title: 'Gestion Demandes Matériel - InstrumElec',
  description: 'Application de gestion des demandes de matériel et outillage - Optimisée pour tous les appareils',
  generator: 'Hermann Fipa',
  keywords: ['gestion', 'demandes', 'matériel', 'outillage', 'instrumelec'],
  authors: [{ name: 'Hermann Fipa' }],
  creator: 'Hermann Fipa',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Gestion Demandes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="h-full bg-gray-50 antialiased overflow-x-hidden">
        <UniversalMobileInjector />
        {children}
      </body>
    </html>
  )
}
