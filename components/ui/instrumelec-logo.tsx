import React from 'react';

interface InstrumElecLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  theme?: 'light' | 'dark';
}

export default function InstrumElecLogo({ 
  className = "", 
  size = 'md', 
  showText = true, 
  theme = 'dark' 
}: InstrumElecLogoProps) {
  const sizeClasses = {
    sm: { width: 60, height: 72, textSize: 'text-lg' },
    md: { width: 80, height: 96, textSize: 'text-2xl' },
    lg: { width: 100, height: 120, textSize: 'text-3xl' }
  };

  const currentSize = sizeClasses[size];
  const isLightTheme = theme === 'light';

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Logo SVG */}
      <div className="flex-shrink-0">
        <svg width={currentSize.width} height={currentSize.height} viewBox="0 0 100 120">
          <defs>
            <radialGradient id="perfectGeometryGradient" cx="0.25" cy="0.25" r="1">
              <stop offset="0%" stopColor="#93c5fd"/>
              <stop offset="50%" stopColor="#3b82f6"/>
              <stop offset="100%" stopColor="#1e40af"/>
            </radialGradient>
            <linearGradient id="perfectRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5"/>
              <stop offset="40%" stopColor="#f87171"/>
              <stop offset="80%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#dc2626"/>
            </linearGradient>
          </defs>
          
          {/* Forme principale */}
          <path 
            d="M50 10 L70 10 L70 5 L30 5 L30 10 L50 10 C28 10, 10 28, 10 60 C10 92, 28 110, 50 110 L70 110 L70 115 L30 115 L30 110 L50 110 C72 110, 90 92, 90 60 C90 28, 72 10, 50 10 Z" 
            fill="url(#perfectGeometryGradient)" 
            stroke="#1e40af" 
            strokeWidth="2"
          />
          
          {/* E blanc */}
          <g transform="translate(50,60)">
            <rect x="-20" y="-40" width="7" height="80" fill="white"/>
            <rect x="-13" y="-40" width="28" height="7" fill="white"/>
            <rect x="-13" y="-7" width="18" height="7" fill="white"/>
            <rect x="-13" y="33" width="28" height="7" fill="white"/>
          </g>
          
          {/* Éclair rouge */}
          <g transform="translate(50,60)">
            <path 
              d="M6 -30 L-6 -5 L1 -5 L1 30 L13 5 L6 5 Z" 
              fill="url(#perfectRedGradient)"
              stroke="#b91c1c"
              strokeWidth="0.3"
            />
            <path 
              d="M6 -30 L-6 -5 L-2 -5 L6 -30 Z" 
              fill="rgba(252, 165, 165, 0.7)"
            />
          </g>
        </svg>
      </div>
      
      {/* Texte conditionnel */}
      {showText && (
        <div className="flex flex-col">
          {isLightTheme ? (
            <>
              <div className={`font-black mb-1 ${currentSize.textSize} text-white`} style={{fontFamily: 'Arial Black, sans-serif'}}>
                InstrumElec
              </div>
              <div 
                className="inline-block px-3 py-1 text-xs font-bold text-blue-900 tracking-wider bg-white/80"
                style={{ borderRadius: '12px', letterSpacing: '1.5px' }}
              >
                CAMEROUN
              </div>
            </>
          ) : (
            <>
              <div className={`font-black mb-1 ${currentSize.textSize}`} style={{fontFamily: 'Arial Black, sans-serif'}}>
                <span style={{ background: 'linear-gradient(45deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Instrum
                </span>
                <span style={{ background: 'linear-gradient(45deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>
                  E
                </span>
                <span style={{ background: 'linear-gradient(45deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}