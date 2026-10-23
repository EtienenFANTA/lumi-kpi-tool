'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KPI_LIST, DEFAULT_OBJECTIFS, KPICode } from '../types/kpi';
import { getCurrentWeek } from '../utils/weekCalculator';
import WeekSelector from '../components/WeekSelector';

interface KPIData {
  code: KPICode;
  label: string;
  valeur: number | null;
  objectif: number | null;
  pourcentage: number | null;
  couleur: string;
  message: string;
}

export default function Visualisation() {
  const router = useRouter();
  const [profileName, setProfileName] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState({ year: 2026, week: 43 });
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem('selectedProfile');
    if (!savedProfile) {
      router.push('/');
      return;
    }

    setProfileName(savedProfile);
    const actualWeek = getCurrentWeek();
    setCurrentWeek(actualWeek);

    loadVisualisationData(savedProfile, actualWeek.year, actualWeek.week);
  }, [router]);

  const loadVisualisationData = async (profile: string, year: number, week: number) => {
    try {
      const response = await fetch('/api/lire-semaine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          annee: year,
          semaine: week,
          personne: profile,
          env: 'test'
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.saisie) {
          const kpiDataArray: KPIData[] = KPI_LIST.filter(kpi => kpi.code !== 'conversion').map((kpi) => {
            const valeur = data.saisie[kpi.code] ?? null;
            const objectif = data.objectifs?.[kpi.code] ?? null;

            let pourcentage: number | null = null;
            let couleur = 'gray';
            let message = 'Non renseigné';

            if (valeur !== null && objectif !== null && objectif > 0) {
              pourcentage = Math.round((valeur / objectif) * 100);

              if (pourcentage >= 100) {
                couleur = 'green';
                message = '✅ Atteint';
              } else if (pourcentage >= 75) {
                couleur = 'lightgreen';
                message = '⚠️ Proche';
              } else if (pourcentage >= 50) {
                couleur = 'orange';
                message = '📊 Moyen';
              } else {
                couleur = 'red';
                message = '❌ Faible';
              }
            }

            return {
              code: kpi.code,
              label: kpi.libelle,
              valeur,
              objectif,
              pourcentage,
              couleur,
              message
            };
          });

          setKpiData(kpiDataArray);
        } else {
          // Pas de saisie pour cette semaine, afficher les KPI vides avec objectifs
          const kpiDataArray: KPIData[] = KPI_LIST.filter(kpi => kpi.code !== 'conversion').map((kpi) => {
            const objectif = data.objectifs?.[kpi.code] ?? null;

            return {
              code: kpi.code,
              label: kpi.libelle,
              valeur: null,
              objectif,
              pourcentage: null,
              couleur: 'gray',
              message: 'Non renseigné'
            };
          });

          setKpiData(kpiDataArray);
        }
      }
    } catch (error) {
      console.error('Erreur chargement visualisation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetourSaisie = () => {
    router.push(`/dashboard?year=${currentWeek.year}&week=${currentWeek.week}`);
  };

  const handleChangeProfile = () => {
    localStorage.removeItem('selectedProfile');
    router.push('/');
  };

  const handleWeekChange = (year: number, week: number) => {
    setCurrentWeek({ year, week });
    setLoading(true);
    loadVisualisationData(profileName, year, week);
  };

  const getColorClass = (couleur: string) => {
    switch (couleur) {
      case 'green': return 'bg-green-500 text-white';
      case 'lightgreen': return 'bg-green-400 text-white';
      case 'orange': return 'bg-orange-400 text-white';
      case 'red': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Calculs pour le message
  const kpisAvecObjectif = kpiData.filter(k => k.objectif !== null && k.valeur !== null);
  const kpisAtteints = kpisAvecObjectif.filter(k => k.pourcentage && k.pourcentage >= 100);
  const pourcentageAtteints = kpisAvecObjectif.length > 0
    ? Math.round((kpisAtteints.length / kpisAvecObjectif.length) * 100)
    : 0;

  let message = '';
  let couleur = 'from-blue-500 to-purple-600';
  let emoji = '💪';

  if (pourcentageAtteints >= 100) {
    message = 'Bravo ! Si tu continues comme ça, les résultats commerciaux vont arriver';
    couleur = 'from-green-500 to-emerald-600';
    emoji = '🎉';
  } else if (pourcentageAtteints >= 81) {
    message = 'Super semaine, on continue !';
    couleur = 'from-green-400 to-teal-500';
    emoji = '🌟';
  } else if (pourcentageAtteints >= 50) {
    message = 'Bonne semaine, juste quelques petites choses à améliorer';
    couleur = 'from-orange-400 to-yellow-500';
    emoji = '👍';
  } else {
    message = 'Il faut améliorer certains KPI pas atteints cette semaine';
    couleur = 'from-red-500 to-orange-600';
    emoji = '⚠️';
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header compact */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                📊 Dashboard • {profileName}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRetourSaisie}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ✏️ Modifier
              </button>
              <button
                onClick={handleChangeProfile}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Profil
              </button>
            </div>
          </div>

          {/* Sélecteur de semaine */}
          <div className="flex justify-center">
            <WeekSelector
              year={currentWeek.year}
              week={currentWeek.week}
              onChange={handleWeekChange}
            />
          </div>
        </div>
      </div>

      {/* Contenu principal - scrollable si nécessaire */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">

          {/* Message d'encouragement EN HAUT */}
          <div className={`bg-gradient-to-r ${couleur} rounded-lg shadow-lg p-4 text-white text-center`}>
            <div className="flex items-center justify-center gap-3">
              <div className="text-4xl">{emoji}</div>
              <div className="text-left">
                <div className="text-lg font-bold">{message}</div>
                <div className="text-sm opacity-90">
                  {kpisAtteints.length}/{kpisAvecObjectif.length} objectifs • {pourcentageAtteints}%
                </div>
              </div>
            </div>
          </div>

          {/* Grille compacte des KPI - 4 colonnes */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {kpiData.map((kpi) => (
              <div key={kpi.code} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Header avec titre bien visible */}
                <div className={`px-3 py-2 ${getColorClass(kpi.couleur)}`}>
                  <div className="font-bold text-base text-center">{kpi.label}</div>
                </div>

                {/* Corps compact */}
                <div className="p-2">
                  {/* Valeurs */}
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-xs text-gray-500">Réalisé</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {kpi.valeur ?? '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Obj.</div>
                      <div className="text-lg font-semibold text-gray-600">
                        {kpi.objectif ?? '-'}
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression compacte */}
                  {kpi.pourcentage !== null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{kpi.message}</span>
                        <span className="font-bold">{kpi.pourcentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            kpi.couleur === 'green' ? 'bg-green-500' :
                            kpi.couleur === 'lightgreen' ? 'bg-green-400' :
                            kpi.couleur === 'orange' ? 'bg-orange-400' :
                            kpi.couleur === 'red' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min(kpi.pourcentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
