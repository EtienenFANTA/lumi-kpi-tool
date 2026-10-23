'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Profile = string;

const DEFAULT_PROFILES: Profile[] = ['Pierre', 'Laura', 'Etienne'];

export default function ProfileChoice() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(DEFAULT_PROFILES);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  useEffect(() => {
    // Charger les profils sauvegardés
    const savedProfiles = localStorage.getItem('teamProfiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }

    // Vérifier si un profil est déjà sélectionné
    const savedProfile = localStorage.getItem('selectedProfile');
    if (savedProfile) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    localStorage.setItem('selectedProfile', profile);
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  const handleAddProfile = () => {
    if (newProfileName.trim() && !profiles.includes(newProfileName.trim())) {
      const updatedProfiles = [...profiles, newProfileName.trim()];
      setProfiles(updatedProfiles);
      localStorage.setItem('teamProfiles', JSON.stringify(updatedProfiles));
      setNewProfileName('');
      setIsAddingProfile(false);
    }
  };

  const handleRemoveProfile = (profileToRemove: Profile) => {
    if (profiles.length > 1) {
      const updatedProfiles = profiles.filter(p => p !== profileToRemove);
      setProfiles(updatedProfiles);
      localStorage.setItem('teamProfiles', JSON.stringify(updatedProfiles));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Titre */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LUMI KPI
          </h1>
          <p className="text-gray-600">
            Suivi hebdomadaire des KPI commerciaux
          </p>
        </div>

        {/* Carte de sélection */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Choisissez votre profil
            </h2>
            <button
              onClick={() => setIsAddingProfile(!isAddingProfile)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xl hover:bg-blue-700 transition-colors flex items-center justify-center"
              title="Ajouter un membre"
            >
              +
            </button>
          </div>

          {/* Formulaire d'ajout */}
          {isAddingProfile && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddProfile()}
                placeholder="Nom du nouveau membre"
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddProfile}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setIsAddingProfile(false);
                    setNewProfileName('');
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste des profils */}
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => handleProfileSelect(profile)}
                  className={`
                    flex-1 py-4 px-6 rounded-xl font-medium text-lg
                    transition-all duration-200 transform
                    ${
                      selectedProfile === profile
                        ? 'bg-blue-600 text-white scale-105 shadow-lg'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }
                    active:scale-95
                  `}
                >
                  {profile}
                </button>
                {profiles.length > 1 && (
                  <button
                    onClick={() => handleRemoveProfile(profile)}
                    className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold text-xl hover:bg-red-200 transition-colors flex items-center justify-center flex-shrink-0"
                    title="Retirer ce membre"
                  >
                    −
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Votre choix sera mémorisé sur cet appareil
            </p>
            <p className="text-xs text-gray-400 text-center mt-2">
              {profiles.length} membre{profiles.length > 1 ? 's' : ''} dans l&apos;équipe
            </p>
          </div>
        </div>

        {/* Version */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            V1.0 - Guaraní Méditerranée
          </p>
        </div>
      </div>
    </div>
  );
}
