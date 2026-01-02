"use client"

import dynamic from 'next/dynamic'

// Lazy load du composant mobile côté client uniquement
const UniversalMobileInjector = dynamic(
  () => import('@/components/mobile/universal-mobile-injector'),
  { ssr: false }
)

export default function MobileInjectorWrapper() {
  return <UniversalMobileInjector />
}
