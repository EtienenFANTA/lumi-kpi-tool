// Utilitaires pour les couleurs et messages des KPI

export interface KPIStatus {
  level: 'excellent' | 'good' | 'warning' | 'danger' | 'empty';
  color: string;
  bgColor: string;
  borderColor: string;
  message: string;
  showConfetti: boolean;
}

export const getKPIStatus = (valeur: number | null, objectif: number | null): KPIStatus => {
  // Cas : champ vide
  if (valeur === null) {
    return {
      level: 'empty',
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      message: 'Non renseigné',
      showConfetti: false,
    };
  }

  // Cas : pas d'objectif (ex: Signatures)
  if (objectif === null || objectif === 0) {
    return {
      level: 'good',
      color: 'text-gray-700',
      bgColor: 'bg-white',
      borderColor: 'border-gray-300',
      message: '',
      showConfetti: false,
    };
  }

  // Calculer le pourcentage d'atteinte
  const percentage = (valeur / objectif) * 100;

  // ≥ 100% : EXCELLENT (vert fluo + confettis)
  if (percentage >= 100) {
    return {
      level: 'excellent',
      color: 'text-green-900',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500',
      message: '🎉 OBJECTIF ATTEINT BRAVO !',
      showConfetti: true,
    };
  }

  // 75-99% : BON (vert)
  if (percentage >= 75) {
    return {
      level: 'good',
      color: 'text-green-800',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400',
      message: '👍 OBJECTIF PRESQUE ATTEINT',
      showConfetti: false,
    };
  }

  // 50-74% : MOYEN (orange)
  if (percentage >= 50) {
    return {
      level: 'warning',
      color: 'text-orange-800',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      message: '⚠️ OBJECTIF MOITIÉ ATTEINT',
      showConfetti: false,
    };
  }

  // < 50% : DANGER (rouge)
  return {
    level: 'danger',
    color: 'text-red-800',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    message: '🚨 ATTENTION, LE KPI DOIT ÊTRE MEILLEUR LA SEMAINE PROCHAINE',
    showConfetti: false,
  };
};
