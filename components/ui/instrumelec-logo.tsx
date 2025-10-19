import Image from 'next/image'

interface InstrumElecLogoProps {
  width?: number
  height?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function InstrumElecLogo({ 
  width, 
  height, 
  className = "",
  size = 'md',
  showText = true
}: InstrumElecLogoProps) {
  // Dimensions par défaut selon la taille
  // Le logo original a un ratio approximatif de 1:1 (carré)
  const sizeMap = {
    sm: { width: 50, height: 50 },
    md: { width: 80, height: 80 },
    lg: { width: 120, height: 120 }
  }
  
  const dimensions = width && height 
    ? { width, height }
    : sizeMap[size]

  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: dimensions.width, height: dimensions.height }}>
      <Image
        src="/instrumelec-logo.png"
        alt="InstrumElec Cameroun Logo"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority
      />
    </div>
  )
}