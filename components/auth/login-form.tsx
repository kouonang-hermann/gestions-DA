"use client"
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useStore } from '@/stores/useStore';
import InstrumElecLogo from '@/components/ui/instrumelec-logo';

export default function LoginForm() {
  const { login, isLoading, error } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!email || !password) {
      setValidationError("L'email et le mot de passe sont requis");
      return;
    }
    if (!email.includes('@')) {
      setValidationError("Le format de l'email est invalide");
      return;
    }

    const success = await login(email, password);
    if (success) {
      // Redirection vers le dashboard après connexion réussie
      window.location.href = '/dashboard';
    }
  };

  // Détecter la taille d'écran pour optimisations
  const [isMobile, setIsMobile] = useState(false)
  const [screenHeight, setScreenHeight] = useState(0)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setScreenHeight(window.innerHeight)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row login-main-container" style={{ minHeight: screenHeight > 0 ? `${screenHeight}px` : '100vh' }}>
      {/* Panneau de gauche - Image Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Overlay de gradient */}
        <div 
          className="absolute inset-0 z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(1, 95, 196, 0.85) 0%, rgba(184, 209, 223, 0.7) 100%)'
          }}
        ></div>
        
        {/* Image de fond */}
        <img 
          src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
          alt="Équipement industriel professionnel"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Contenu */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo et slogan */}
          <div>
            <div className="flex items-center mb-6">
              <InstrumElecLogo width={80} height={107} showText={false} className="drop-shadow-lg" />
            </div>
            <p className="text-lg font-light leading-relaxed max-w-md">
              Votre partenaire de confiance pour la gestion intelligente du matériel et de l'outillage professionnel
            </p>
          </div>

          {/* Éléments décoratifs */}
          <div className="flex justify-center space-x-8 opacity-30">
            <div className="w-16 h-16 border-2 border-white rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded"></div>
            </div>
            <div className="w-20 h-20 border-2 border-white rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </div>
            <div className="w-16 h-16 border-2 border-white rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-sm transform rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de droite - Formulaire de connexion */}
      <div className="flex-1 flex items-center justify-center login-container bg-white min-h-screen lg:min-h-0" style={{ padding: isMobile ? '1rem' : '2rem' }}>
        <div className="max-w-md w-full login-form-wrapper">
          {/* En-tête de bienvenue */}
          <div className="text-center login-header" style={{ marginBottom: screenHeight < 600 ? '1rem' : '2rem' }}>
            {/* Logo responsive */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="login-logo-mobile">
                <InstrumElecLogo width={60} height={80} showText={false} className="drop-shadow-lg" />
              </div>
            </div>
            {/* Logo mobile alternatif pour très petits écrans */}
            <div className="lg:hidden mb-2 mobile-only">
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#015fc4' }}>
                InstrumElec
              </h1>
            </div>
            <h2 
              className="login-title font-bold mb-2"
              style={{ 
                color: '#015fc4',
                fontSize: isMobile ? (screenHeight < 600 ? '1.25rem' : '1.5rem') : '2.5rem'
              }}
            >
              Bienvenue
            </h2>
            <p className="login-subtitle text-gray-600">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="login-form" style={{ gap: screenHeight < 600 ? '0.75rem' : '1.5rem', display: 'flex', flexDirection: 'column' }}>
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#015fc4' }}>
                Adresse Email
              </label>
              <div className="relative">
                <Mail 
                  className="login-input-icon absolute top-1/2 transform -translate-y-1/2" 
                  style={{ 
                    color: '#b8d1df',
                    left: isMobile ? '0.75rem' : '1rem',
                    width: isMobile ? '1rem' : '1.25rem',
                    height: isMobile ? '1rem' : '1.25rem'
                  }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isMobile ? "Email" : "votre.email@example.com"}
                  className="login-input w-full border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc',
                    minHeight: '48px',
                    fontSize: '16px', // Évite le zoom sur iOS
                    paddingLeft: isMobile ? '2.5rem' : '3rem',
                    paddingRight: isMobile ? '1rem' : '1.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#015fc4';
                    e.target.style.backgroundColor = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#b8d1df';
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#015fc4' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock 
                  className="login-input-icon absolute top-1/2 transform -translate-y-1/2" 
                  style={{ 
                    color: '#b8d1df',
                    left: isMobile ? '0.75rem' : '1rem',
                    width: isMobile ? '1rem' : '1.25rem',
                    height: isMobile ? '1rem' : '1.25rem'
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isMobile ? "Mot de passe" : "••••••••••••"}
                  className="login-input w-full border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc',
                    minHeight: '48px',
                    fontSize: '16px', // Évite le zoom sur iOS
                    paddingLeft: isMobile ? '2.5rem' : '3rem',
                    paddingRight: isMobile ? '3rem' : '3.5rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#015fc4';
                    e.target.style.backgroundColor = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#b8d1df';
                    e.target.style.backgroundColor = '#f8fafc';
                  }}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="login-password-toggle login-touch-target absolute top-1/2 transform -translate-y-1/2 flex items-center justify-center"
                  style={{ 
                    right: isMobile ? '0.5rem' : '1rem',
                    minWidth: '44px', 
                    minHeight: '44px',
                    borderRadius: '0.375rem',
                    backgroundColor: 'transparent'
                  }}
                >
                  {showPassword ? (
                    <EyeOff 
                      className="mx-auto" 
                      style={{ 
                        color: '#b8d1df',
                        width: isMobile ? '1rem' : '1.25rem',
                        height: isMobile ? '1rem' : '1.25rem'
                      }} 
                    />
                  ) : (
                    <Eye 
                      className="mx-auto" 
                      style={{ 
                        color: '#b8d1df',
                        width: isMobile ? '1rem' : '1.25rem',
                        height: isMobile ? '1rem' : '1.25rem'
                      }} 
                    />
                  )}
                </button>
              </div>
            </div>

            {/* Affichage des erreurs */}
            {(error || validationError) && (
              <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error || validationError}
              </div>
            )}

            {/* Mot de passe oublié */}
            <div className="text-right">
              <button 
                type="button"
                className="login-link login-touch-target hover:underline" 
                style={{ 
                  color: '#015fc4', 
                  minHeight: '44px',
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                  padding: '0.5rem'
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-button login-touch-target w-full rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:bg-red-600"
              style={{ 
                backgroundColor: '#fc2d1f',
                border: 'none',
                minHeight: '52px',
                padding: isMobile ? '0.875rem 1rem' : '1rem 1.5rem',
                fontSize: isMobile ? '0.9375rem' : '1.125rem'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 
                    className="mr-2 animate-spin" 
                    style={{
                      width: isMobile ? '1rem' : '1.25rem',
                      height: isMobile ? '1rem' : '1.25rem'
                    }}
                  />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span className="font-semibold">SE CONNECTER</span>
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="text-center login-footer" style={{ marginTop: screenHeight < 600 ? '1rem' : '2rem' }}>
            <p className="text-gray-600" style={{ fontSize: isMobile ? '0.875rem' : '0.9375rem', padding: '0 0.5rem' }}>
              Pas encore de compte ?{' '}
              <button 
                type="button"
                className="login-link login-touch-target font-semibold hover:underline"
                style={{ 
                  color: '#fc2d1f', 
                  minHeight: '44px',
                  padding: '0.5rem'
                }}
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}