"use client"

import React from 'react'

interface InstrumElecLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function InstrumElecLogo({ className = "", size = 'md', showText = true }: InstrumElecLogoProps) {
  const sizeClasses = {
    sm: { width: 60, height: 72, textSize: 'text-lg' },
    md: { width: 100, height: 120, textSize: 'text-2xl' },
    lg: { width: 120, height: 140, textSize: 'text-3xl' }
  }

  const currentSize = sizeClasses[size]

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo SVG avec forme déformée exacte */}
      <div className="flex-shrink-0">
        <svg width={currentSize.width} height={currentSize.height} viewBox="0 0 100 120">
          
          {/* Contour du logo - cercle déformé par les extensions du E */}
          <path 
            d="M15 60 
               C15 35, 25 20, 40 15
               L70 15
               L70 5
               L30 5
               L30 15
               C25 20, 15 35, 15 60
               C15 85, 25 100, 30 105
               L30 115
               L70 115
               L70 105
               L40 105
               C25 100, 15 85, 15 60 Z" 
            fill="url(#perfectBlueGradient)" 
            stroke="#1e40af" 
            strokeWidth="2"
          />
          
          {/* E blanc parfaitement intégré */}
          <g transform="translate(50,60)">
            {/* Barre verticale */}
            <rect x="-20" y="-45" width="7" height="90" fill="white"/>
            
            {/* Barres horizontales intégrées au contour */}
            <rect x="-13" y="-45" width="28" height="7" fill="white"/>
            <rect x="-13" y="-7" width="18" height="7" fill="white"/>
            <rect x="-13" y="31" width="28" height="7" fill="white"/>
          </g>
          
          {/* Éclair rouge final */}
          <g transform="translate(50,60)">
            <path 
              d="M6 -35 
                 L-8 -3 
                 L0 -3 
                 L0 35 
                 L14 3 
                 L6 3 
                 Z" 
              fill="url(#perfectRedGradient)"
              stroke="#b91c1c"
              strokeWidth="0.3"
            />
            
            {/* Brillance */}
            <path 
              d="M6 -35 L-8 -3 L-4 -3 L6 -35 Z" 
              fill="rgba(252, 165, 165, 0.8)"
            />
          </g>
          
          <defs>
            <radialGradient id="perfectBlueGradient" cx="0.2" cy="0.2" r="1.2">
              <stop offset="0%" stopColor="#93c5fd"/>
              <stop offset="40%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#1e40af"/>
            </radialGradient>
            
            <linearGradient id="perfectRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5"/>
              <stop offset="30%" stopColor="#f87171"/>
              <stop offset="70%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#dc2626"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Texte InstrumElec Cameroun */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-black mb-1 ${currentSize.textSize}`} style={{fontFamily: 'Arial Black, sans-serif'}}>
            <span style={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Instrum
            </span>
            <span style={{
              background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '900'
            }}>
              E
            </span>
            <span style={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              lec
            </span>
          </div>
          
          <div 
            className="inline-block px-3 py-1 text-xs font-bold text-white tracking-wider"
            style={{
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
              borderRadius: '12px',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 8px rgba(37, 99, 235, 0.4)',
              border: '1px solid #1d4ed8',
              letterSpacing: '1.5px'
            }}
          >
            CAMEROUN
          </div>
        </div>
      )}
    </div>
  )
}
