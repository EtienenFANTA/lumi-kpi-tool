'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
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

  // ===== AUTO-SAVE N8N (T-053) =====
  const hasUnsavedChanges = useRef(false); // Flag pour détecter les changements
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null); // Timer 5 minutes

  // ===== INDICATEUR DE STATUT (T-054) =====
  type SaveStatus = 'idle' | 'draft' | 'saving' | 'saved' | 'error';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

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

  // ===== AUTO-SAVE N8N : beforeunload et cleanup (T-053) =====
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        // Sauvegarder avant de quitter
        console.log('🚪 Sauvegarde avant fermeture...');
        await saveToN8N(true);

        // Empêcher la fermeture immédiate (le navigateur affichera une confirmation)
        e.preventDefault();
        e.returnValue = '';
      }
    };

    // Ajouter l'event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup à la destruction du composant
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Nettoyer le timer
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [profileName, currentWeek, saisies, details]); // Dépendances pour que saveToN8N ait les bonnes valeurs

  // ===== RAFRAÎCHIR LE BADGE "il y a X min" (T-054) =====
  useEffect(() => {
    if (saveStatus === 'saved' && lastSavedAt) {
      const interval = setInterval(() => {
        // Forcer un re-render pour mettre à jour le texte "il y a X min"
        setLastSavedAt(new Date(lastSavedAt));
      }, 60000); // Toutes les minutes

      return () => clearInterval(interval);
    }
  }, [saveStatus, lastSavedAt]);

  // ===== FONCTIONS DE GESTION DU LOCALSTORAGE (T-052) =====

  /**
   * Génère la clé unique pour le localStorage
   * Format : draft_Pierre_2026_S43
   */
  const getDraftKey = (profile: string, year: number, week: number): string => {
    return `draft_${profile}_${year}_S${week}`;
  };

  /**
   * Sauvegarde le brouillon dans localStorage
   */
  const saveDraftToLocalStorage = (saisiesData: Saisie[], detailsData: Record<string, any[]>) => {
    try {
      const key = getDraftKey(profileName, currentWeek.year, currentWeek.week);
      const draft = {
        saisies: saisiesData,
        details: detailsData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(draft));
      console.log('💾 Brouillon sauvegardé localement:', key);

      // 🎨 Mettre à jour le statut visuel (T-054)
      setSaveStatus('draft');
    } catch (error) {
      console.error('Erreur sauvegarde localStorage:', error);
    }
  };

  /**
   * Charge le brouillon depuis localStorage
   * Retourne null si pas de brouillon
   */
  const loadDraftFromLocalStorage = (profile: string, year: number, week: number) => {
    try {
      const key = getDraftKey(profile, year, week);
      const stored = localStorage.getItem(key);
      if (stored) {
        const draft = JSON.parse(stored);
        console.log('📂 Brouillon chargé depuis localStorage:', key, draft.savedAt);
        return draft;
      }
    } catch (error) {
      console.error('Erreur chargement localStorage:', error);
    }
    return null;
  };

  /**
   * Supprime le brouillon après sauvegarde réussie vers N8N
   */
  const clearDraftFromLocalStorage = () => {
    try {
      const key = getDraftKey(profileName, currentWeek.year, currentWeek.week);
      localStorage.removeItem(key);
      console.log('🗑️ Brouillon supprimé après sauvegarde N8N:', key);
    } catch (error) {
      console.error('Erreur suppression localStorage:', error);
    }
  };

  // ===== FIN FONCTIONS LOCALSTORAGE =====

  const loadWeekData = async (profile: string, year: number, week: number) => {
    try {
      // 📂 PRIORITÉ 1 : Charger le brouillon localStorage s'il existe (T-052)
      const draft = loadDraftFromLocalStorage(profile, year, week);
      if (draft) {
        console.log('✅ Brouillon local trouvé, chargement...');
        setSaisies(draft.saisies);
        setDetails(draft.details || {});
        return; // On s'arrête ici, le brouillon local est prioritaire
      }

      // 📡 PRIORITÉ 2 : Charger depuis N8N si pas de brouillon local
      const response = await fetch('/api/lire-semaine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          annee: year,
          semaine: week,
          personne: profile,
          env: 'test' // ⚠️ RETOUR MODE TEST - Migration PROD échouée
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

    // Initialiser UNIQUEMENT les détails des KPI qui en ont besoin
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

    // 💾 SAUVEGARDE LOCALE INSTANTANÉE (T-052)
    saveDraftToLocalStorage(updatedSaisies, details);

    // 🔄 MARQUER COMME MODIFIÉ et relancer le timer (T-053)
    hasUnsavedChanges.current = true;
    startAutoSaveTimer();
  };

  const handleDetailsChange = (kpiCode: KPICode, newDetails: any[]) => {
    const updatedDetails = {
      ...details,
      [kpiCode]: newDetails,
    };
    setDetails(updatedDetails);

    // 💾 SAUVEGARDE LOCALE INSTANTANÉE (T-052)
    saveDraftToLocalStorage(saisies, updatedDetails);

    // 🔄 MARQUER COMME MODIFIÉ et relancer le timer (T-053)
    hasUnsavedChanges.current = true;
    startAutoSaveTimer();
  };

  const getObjectif = (kpiCode: KPICode): number | null => {
    const objectif = DEFAULT_OBJECTIFS.find(
      (o) => o.personne === profileName && o.kpi === kpiCode
    );
    return objectif?.valeur ?? null;
  };

  // ===== AUTO-SAVE N8N (T-053) =====

  /**
   * Sauvegarde vers N8N sans redirection (pour auto-save)
   * Retourne true si succès, false sinon
   */
  const saveToN8N = async (silent: boolean = false): Promise<boolean> => {
    // 🎨 Mettre à jour le statut visuel (T-054)
    setSaveStatus('saving');

    try {
      // Construire les données au format API
      const kpiData: any = {
        annee: currentWeek.year,
        semaine: currentWeek.week,
        personne: profileName,
        env: 'test',
        modifie_par: profileName,
      };

      // Ajouter tous les KPI
      saisies.forEach((saisie) => {
        kpiData[saisie.kpi] = saisie.valeur;
      });

      // Ajouter les détails en JSON
      const kpisAvecDetails = ['rdv_pris', 'rdv_faits', 'rdv_df', 'prez', 'ref', 'besoins', 'signatures'];
      const detailsFiltres: Record<string, any[]> = {};

      kpisAvecDetails.forEach(kpiCode => {
        const saisieKpi = saisies.find(s => s.kpi === kpiCode);
        const valeur = saisieKpi?.valeur ?? 0;

        if (valeur > 0 && details[kpiCode] && details[kpiCode].length > 0) {
          const detailsNonVides = details[kpiCode].filter(detail => {
            const { id, ...fields } = detail;
            return Object.values(fields).some(value => typeof value === 'string' && value.trim() !== '');
          });

          if (detailsNonVides.length > 0) {
            detailsFiltres[kpiCode] = detailsNonVides;
          }
        }
      });

      if (Object.keys(detailsFiltres).length > 0) {
        kpiData.details_json = JSON.stringify(detailsFiltres);
      }

      // Appeler l'API
      const response = await fetch('/api/enregistrer-semaine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(kpiData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Succès : nettoyer le brouillon et marquer comme sauvegardé
        clearDraftFromLocalStorage();
        hasUnsavedChanges.current = false;

        // 🎨 Mettre à jour le statut visuel (T-054)
        setSaveStatus('saved');
        setLastSavedAt(new Date());

        if (!silent) {
          console.log('✅ Sauvegarde N8N réussie');
        }
        return true;
      } else {
        // 🎨 Mettre à jour le statut visuel (T-054)
        setSaveStatus('error');

        if (!silent) {
          console.error('❌ Erreur sauvegarde N8N:', data.message);
        }
        return false;
      }
    } catch (error) {
      // 🎨 Mettre à jour le statut visuel (T-054)
      setSaveStatus('error');

      if (!silent) {
        console.error('❌ Erreur réseau sauvegarde N8N:', error);
      }
      return false;
    }
  };

  /**
   * Lance le timer d'auto-save (5 minutes)
   */
  const startAutoSaveTimer = () => {
    // Annuler le timer précédent s'il existe
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Lancer un nouveau timer de 5 minutes
    autoSaveTimer.current = setTimeout(async () => {
      if (hasUnsavedChanges.current) {
        console.log('⏰ Auto-save 5 min : sauvegarde en cours...');
        await saveToN8N(true);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // ===== FIN AUTO-SAVE N8N =====

  const handleSave = async () => {
    // ⚠️ VALIDATION NON BLOQUANTE (T-055)
    // Vérifier si des KPI sont manquants, mais NE PAS bloquer l'enregistrement
    const kpisObligatoires = KPI_LIST.filter(kpi => kpi.hasObjectif && !kpi.calcule);
    const kpisManquants = kpisObligatoires.filter(kpi => {
      const saisie = saisies.find(s => s.kpi === kpi.code);
      return saisie?.valeur === null || saisie?.valeur === undefined;
    });

    if (kpisManquants.length > 0) {
      // Avertissement NON bloquant : demander confirmation
      const listeManquants = kpisManquants.map(kpi => `• ${kpi.libelle}`).join('\n');
      const confirmer = confirm(
        `⚠️ Attention : ${kpisManquants.length} KPI manquant(s) :\n\n${listeManquants}\n\nVoulez-vous enregistrer quand même ?`
      );

      if (!confirmer) {
        return; // L'utilisateur annule
      }
    }

    // Sauvegarder vers N8N (même si incomplet)
    const success = await saveToN8N(false);

    if (success) {
      // Succès : rediriger vers la page de visualisation
      router.push('/visualisation');
    } else {
      // Erreur
      alert('❌ Erreur lors de l\'enregistrement. Vos données sont sauvegardées localement.');
    }
  };

  // ===== COMPOSANT BADGE DE STATUT (T-054) =====
  const SaveStatusBadge = () => {
    const getTimeAgo = (date: Date): string => {
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'il y a quelques secondes';
      const minutes = Math.floor(seconds / 60);
      if (minutes === 1) return 'il y a 1 minute';
      if (minutes < 60) return `il y a ${minutes} minutes`;
      const hours = Math.floor(minutes / 60);
      if (hours === 1) return 'il y a 1 heure';
      return `il y a ${hours} heures`;
    };

    const badges = {
      idle: null,
      draft: (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm">
          <span className="text-base">💾</span>
          <span>Brouillon sauvegardé</span>
        </div>
      ),
      saving: (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm animate-pulse">
          <span className="text-base">⏳</span>
          <span>Enregistrement en cours...</span>
        </div>
      ),
      saved: (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
          <span className="text-base">✅</span>
          <span>
            Enregistré {lastSavedAt ? getTimeAgo(lastSavedAt) : ''}
          </span>
        </div>
      ),
      error: (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
          <span className="text-base">❌</span>
          <span>Erreur - données en local</span>
        </div>
      ),
    };

    return badges[saveStatus];
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
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Badge de statut de sauvegarde (T-054) */}
                <SaveStatusBadge />
                <button
                  onClick={handleChangeProfile}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Changer de profil
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
