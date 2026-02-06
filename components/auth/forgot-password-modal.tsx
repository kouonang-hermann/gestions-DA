"use client"
import React, { useState } from 'react';
import { X, User, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation des champs
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      // Appel à l'API de récupération de mot de passe
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: fullName.trim(),
          telephone: phoneNumber.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setNewPassword(result.newPassword);
        // Réinitialiser les champs
        setFullName('');
        setPhoneNumber('');
      } else {
        setError(result.error || 'Aucun utilisateur trouvé avec ces informations');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFullName('');
    setPhoneNumber('');
    setError('');
    setSuccess(false);
    setNewPassword('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        {/* Bouton de fermeture */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <X className="h-5 w-5" />
        </button>

        {/* En-tête */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#015fc4' }}>
            Mot de passe oublié
          </h2>
          <p className="text-gray-600 text-sm">
            Entrez vos informations pour récupérer votre mot de passe
          </p>
        </div>

        {/* Affichage du succès */}
        {success && newPassword ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                Mot de passe récupéré avec succès !
              </p>
              <p className="text-sm text-green-700 mb-3">
                Voici votre nouveau mot de passe temporaire :
              </p>
              <div className="bg-white border-2 border-green-300 rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold" style={{ color: '#015fc4' }}>
                  {newPassword}
                </p>
              </div>
              <p className="text-xs text-green-600 mt-3">
                ⚠️ Veuillez noter ce mot de passe et le changer après votre première connexion.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full rounded-lg text-white font-semibold py-3 transition-all"
              style={{ backgroundColor: '#015fc4' }}
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Champ Nom complet */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium mb-2" style={{ color: '#015fc4' }}>
                Nom complet
              </label>
              <div className="relative">
                <User 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                  style={{ color: '#b8d1df', width: '1.25rem', height: '1.25rem' }}
                />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc',
                    fontSize: '16px',
                    minHeight: '48px'
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

            {/* Champ Numéro de téléphone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium mb-2" style={{ color: '#015fc4' }}>
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2" 
                  style={{ color: '#b8d1df', width: '1.25rem', height: '1.25rem' }}
                />
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  className="w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#b8d1df',
                    backgroundColor: '#f8fafc',
                    fontSize: '16px',
                    minHeight: '48px'
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

            {/* Affichage des erreurs */}
            {error && (
              <div className="flex items-start space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 border-2 rounded-lg font-semibold transition-colors"
                style={{ 
                  borderColor: '#b8d1df',
                  color: '#015fc4',
                  minHeight: '48px'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg text-white font-semibold transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#fc2d1f',
                  minHeight: '48px'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <span>Récupérer</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
