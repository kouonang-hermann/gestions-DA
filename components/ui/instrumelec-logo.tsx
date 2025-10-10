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
  const sizeMap = {
    sm: { width: 150, height: 200 },
    md: { width: 225, height: 300 },
    lg: { width: 300, height: 400 }
  }
  
  const dimensions = width && height 
    ? { width, height }
    : sizeMap[size]

  return (
    <svg
      width={dimensions.width}
      height={dimensions.height}
      viewBox="0 0 300 400"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      {/* Cercle principal - contour uniquement */}
      <circle
        cx="150"
        cy="100"
        r="80"
        stroke="#4AC3E8"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Éclair stylisé */}
      <path
        d="M 145 55 L 135 85 L 150 85 L 140 115 L 155 115 L 145 145"
        fill="#E63946"
        stroke="#E63946"
        strokeWidth="2"
        strokeLinejoin="miter"
      />

      {/* Lettre E - chevauche le cercle */}
      <text
        x="165"
        y="135"
        fontSize="120"
        fontWeight="900"
        fill="#4AC3E8"
        fontFamily="Arial, sans-serif"
        opacity="0.95"
      >
        E
      </text>

      {/* Texte InstrumElec */}
      {showText && (
        <>
          <text
            x="150"
            y="260"
            fontSize="42"
            fontWeight="700"
            fontFamily="Poppins, Montserrat, sans-serif"
            textAnchor="middle"
            letterSpacing="1"
          >
            <tspan fill="#E63946">Instrum</tspan>
            <tspan fill="#4AC3E8">Elec</tspan>
          </text>

          {/* Bandeau CAMEROUN */}
          <rect x="50" y="300" width="200" height="40" rx="8" ry="8" fill="#2E7D9B" />
          <text
            x="150"
            y="325"
            fontSize="22"
            fontWeight="700"
            fill="#4AC3E8"
            textAnchor="middle"
            dominantBaseline="middle"
            letterSpacing="1.5"
          >
            CAMEROUN
          </text>
        </>
      )}
    </svg>
  )
}