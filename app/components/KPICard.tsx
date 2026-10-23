'use client';

import { useState, useEffect } from 'react';
import { KPI, Saisie } from '../types/kpi';
import KPIDetails from './KPIDetails';
import Confetti from './Confetti';
import { getKPIStatus } from '../utils/kpiColors';

interface KPICardProps {
  kpi: KPI;
  saisie: Saisie;
  objectif: number | null;
  details: any[];
  onChange: (saisie: Saisie) => void;
  onDetailsChange: (details: any[]) => void;
}

export default function KPICard({ kpi, saisie, objectif, details, onChange, onDetailsChange }: KPICardProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const status = getKPIStatus(saisie.valeur, objectif);

  // Déclencher les confettis quand l'objectif est atteint
  useEffect(() => {
    if (status.showConfetti && saisie.valeur !== null) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status.showConfetti, saisie.valeur]);

  const handleValueChange = (value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    if (numValue !== null && (numValue < 0 || isNaN(numValue))) return;

    onChange({
      ...saisie,
      valeur: numValue,
    });
  };

  const handleCommentChange = (comment: string) => {
    onChange({
      ...saisie,
      commentaire: comment,
    });
  };

  return (
    <div className={`rounded-lg shadow-md p-4 hover:shadow-lg transition-all border-2 ${status.bgColor} ${status.borderColor}`}>
      {/* Confettis */}
      {showConfetti && <Confetti show={showConfetti} />}

      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg flex items-center gap-2 ${status.color}`}>
            {kpi.libelle}
            {kpi.infobulle && (
              <span className="text-gray-400 text-sm" title={kpi.infobulle}>
                ℹ️
              </span>
            )}
          </h3>
          {objectif !== null && kpi.hasObjectif && (
            <p className="text-sm text-gray-600">
              Objectif : {kpi.code === 'conversion' ? `${objectif}%` : objectif}
            </p>
          )}
        </div>
      </div>

      {/* Champ de saisie */}
      <div className="mb-3">
        {kpi.calcule ? (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
            <span className="text-2xl font-bold text-blue-600">
              {saisie.valeur !== null ? `${saisie.valeur}%` : '—'}
            </span>
            <p className="text-xs text-blue-600 mt-1">Calculé automatiquement</p>
          </div>
        ) : (
          <input
            type="number"
            min="0"
            step="1"
            value={saisie.valeur ?? ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Saisir la valeur"
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${status.borderColor}`}
          />
        )}
      </div>

      {/* Message de statut */}
      {status.message && (
        <div className={`mb-3 p-2 rounded-lg text-center font-semibold text-sm ${status.color} ${status.bgColor}`}>
          {status.message}
        </div>
      )}

      {/* Section détails (affichage automatique selon le nombre) */}
      <KPIDetails
        kpiCode={kpi.code}
        count={saisie.valeur ?? 0}
        details={details}
        onChange={onDetailsChange}
      />

      {/* Commentaire */}
      <textarea
        value={saisie.commentaire}
        onChange={(e) => handleCommentChange(e.target.value)}
        placeholder="Commentaire général (optionnel)"
        rows={2}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mt-3"
      />

      {/* Modifié par */}
      {saisie.modifiePar && saisie.modifieLe && (
        <div className="mt-2 text-xs text-gray-500 italic">
          Modifié par {saisie.modifiePar} le{' '}
          {new Date(saisie.modifieLe).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}
