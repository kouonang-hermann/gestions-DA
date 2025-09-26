"use client"
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Loader2, Plane } from 'lucide-react';
import { useStore } from '@/stores/useStore';

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

    await login(email, password);
  };

  return (
    <div className="min-h-screen flex">
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
              <Plane className="w-8 h-8 mr-3 text-white" />
              <h1 className="text-4xl font-bold font-serif">InstrumElec</h1>
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
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full">
          {/* En-tête de bienvenue */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Plane 
                  className="w-10 h-10 transform rotate-12" 
                  style={{ color: '#015fc4' }}
                />
                <div 
                  className="absolute top-0 right-0 w-6 h-6 border-2 border-dashed rounded-full"
                  style={{ borderColor: '#b8d1df' }}
                ></div>
              </div>
            </div>
            <h2 
              className="text-4xl font-bold mb-2"
              style={{ color: '#015fc4' }}
            >
              Bienvenue
            </h2>
            <p className="text-gray-600">Connectez-vous pour accéder à votre espace</p>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#015fc4' }}>
                Adresse Email
              </label>
              <div className="relative">
                <Mail 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#b8d1df' }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@example.com"
                  className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc'
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                  style={{ color: '#b8d1df' }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc'
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
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" style={{ color: '#b8d1df' }} />
                  ) : (
                    <Eye className="w-5 h-5" style={{ color: '#b8d1df' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Affichage des erreurs */}
            {(error || validationError) && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                {error || validationError}
              </div>
            )}

            {/* Mot de passe oublié */}
            <div className="text-right">
              <button 
                type="button"
                className="text-sm hover:underline"
                style={{ color: '#015fc4' }}
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#fc2d1f',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#e02719';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = '#fc2d1f';
                }
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'SE CONNECTER'
              )}
            </button>
          </form>

          {/* Lien d'inscription */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Pas encore de compte ?{' '}
              <button 
                type="button"
                className="font-semibold hover:underline"
                style={{ color: '#fc2d1f' }}
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