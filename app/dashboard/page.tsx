'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KPICard from '../components/KPICard';
import WeekSelector from '../components/WeekSelector';
import { KPI_LIST, DEFAULT_OBJECTIFS, Saisie, KPICode } from '../types/kpi';
import { getCurrentWeek } from '../utils/weekCalculator';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileName, setProfileName] = useState<string>('');
  const [saisies, setSaisies] = useState<Saisie[]>([]);
  const [details, setDetails] = useState<Record<string, any[]>>({});
  const [currentWeek, setCurrentWeek] = useState({ year: 2026, week: 43 });

  useEffect(() => {
    const savedProfile = localStorage.getItem('selectedProfile');
    if (!savedProfile) {
      router.push('/');
      return;
    }

    setProfileName(savedProfile);

    // Récupérer les paramètres d'URL ou utiliser la semaine actuelle
    const yearParam = searchParams.get('year');
    const weekParam = searchParams.get('week');

    let targetWeek;
    if (yearParam && weekParam) {
      targetWeek = {
        year: parseInt(yearParam),
        week: parseInt(weekParam)
      };
    } else {
      targetWeek = getCurrentWeek();
    }

    setCurrentWeek(targetWeek);
    loadWeekData(savedProfile, targetWeek.year, targetWeek.week);
  }, [router, searchParams]);

  const loadWeekData = async (profile: string, year: number, week: number) => {
    try {
      // Appeler l'API pour lire les données de la semaine
      const response = await fetch('/api/lire-semaine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          annee: year,
          semaine: week,
          personne: profile,
          env: 'test' // TODO: changer en 'prod' pour la production
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.saisie) {
          // Convertir les données API en format saisies
          const apiSaisies: Saisie[] = KPI_LIST.map((kpi) => ({
            kpi: kpi.code,
            valeur: data.saisie[kpi.code] ?? null,
            commentaire: '',
          }));
          setSaisies(apiSaisies);

          // Charger les détails si disponibles
          if (data.saisie.details_json) {
            try {
              setDetails(JSON.parse(data.saisie.details_json));
            } catch (e) {
              console.error('Erreur parsing details_json:', e);
              setDetails({});
            }
          }
        } else {
          // Pas de données pour cette semaine, initialiser vide
          initializeEmptyWeek();
        }
      } else {
        console.error('Erreur API lire-semaine:', response.status);
        initializeEmptyWeek();
      }
    } catch (error) {
      console.error('Erreur chargement semaine:', error);
      initializeEmptyWeek();
    }
  };

  const initializeEmptyWeek = () => {
    const initialSaisies: Saisie[] = KPI_LIST.map((kpi) => ({
      kpi: kpi.code,
      valeur: null,
      commentaire: '',
    }));
    setSaisies(initialSaisies);

    setDetails({
      rdv_pris: [],
      rdv_faits: [],
      rdv_df: [],
      prez: [],
      ref: [],
      besoins: [],
      signatures: [],
    });
  };

  const handleChangeProfile = () => {
    localStorage.removeItem('selectedProfile');
    router.push('/');
  };

  const handleWeekChange = (year: number, week: number) => {
    setCurrentWeek({ year, week });
    loadWeekData(profileName, year, week);
  };

  const handleSaisieChange = (kpiCode: KPICode, newSaisie: Saisie) => {
    // Ajouter l'info "modifié par" et "modifié le"
    const enrichedSaisie = {
      ...newSaisie,
      modifiePar: profileName,
      modifieLe: new Date(),
    };

    const updatedSaisies = saisies.map((s) =>
      s.kpi === kpiCode ? enrichedSaisie : s
    );

    // Calculer la conversion si nécessaire
    const appels = updatedSaisies.find((s) => s.kpi === 'appels')?.valeur;
    const rdvPris = updatedSaisies.find((s) => s.kpi === 'rdv_pris')?.valeur;

    if (appels !== null && appels !== undefined && rdvPris !== null && rdvPris !== undefined && appels > 0) {
      const conversion = Math.round((rdvPris / appels) * 100);
      const conversionSaisie = updatedSaisies.find((s) => s.kpi === 'conversion');
      if (conversionSaisie) {
        conversionSaisie.valeur = conversion;
        conversionSaisie.modifiePar = profileName;
        conversionSaisie.modifieLe = new Date();
      }
    } else {
      const conversionSaisie = updatedSaisies.find((s) => s.kpi === 'conversion');
      if (conversionSaisie) {
        conversionSaisie.valeur = null;
      }
    }

    setSaisies(updatedSaisies);
  };

  const handleDetailsChange = (kpiCode: KPICode, newDetails: any[]) => {
    setDetails({
      ...details,
      [kpiCode]: newDetails,
    });
  };

  const getObjectif = (kpiCode: KPICode): number | null => {
    const objectif = DEFAULT_OBJECTIFS.find(
      (o) => o.personne === profileName && o.kpi === kpiCode
    );
    return objectif?.valeur ?? null;
  };

  const handleSave = async () => {
    try {
      // Construire les données au format API
      const kpiData: any = {
        annee: currentWeek.year,
        semaine: currentWeek.week,
        personne: profileName,
        env: 'test', // TODO: changer en 'prod' pour la production
        modifie_par: profileName,
      };

      // Ajouter tous les KPI
      saisies.forEach((saisie) => {
        kpiData[saisie.kpi] = saisie.valeur;
      });

      // Ajouter les détails en JSON
      if (Object.keys(details).length > 0) {
        kpiData.details_json = JSON.stringify(details);
      }

      // Appeler l'API pour enregistrer
      const response = await fetch('/api/enregistrer-semaine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(kpiData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Succès : rediriger vers la page de visualisation
        router.push('/visualisation');
      } else {
        // Erreur
        alert('❌ Erreur lors de l\'enregistrement : ' + (data.message || 'Erreur inconnue'));
        console.error('Erreur API:', data);
      }
    } catch (error) {
      console.error('Erreur enregistrement:', error);
      alert('❌ Erreur réseau lors de l\'enregistrement');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Ma semaine
                </h1>
                <p className="text-gray-600 mt-1">{profileName}</p>
              </div>
              <button
                onClick={handleChangeProfile}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Changer de profil
              </button>
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

        {/* Grille des KPI - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {KPI_LIST.map((kpi) => {
            const saisie = saisies.find((s) => s.kpi === kpi.code);
            if (!saisie) return null;

            return (
              <KPICard
                key={kpi.code}
                kpi={kpi}
                saisie={saisie}
                objectif={getObjectif(kpi.code)}
                details={details[kpi.code] || []}
                onChange={(newSaisie) => handleSaisieChange(kpi.code, newSaisie)}
                onDetailsChange={(newDetails) => handleDetailsChange(kpi.code, newDetails)}
              />
            );
          })}
        </div>

        {/* Bouton de sauvegarde fixe en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              💾 Enregistrer ma semaine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
