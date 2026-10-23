'use client';

import { useState, useEffect } from 'react';
import { KPICode } from '../types/kpi';
import { generateId } from '../types/details';

interface KPIDetailsProps {
  kpiCode: KPICode;
  count: number; // Nombre de détails à afficher
  details: any[];
  onChange: (details: any[]) => void;
}

export default function KPIDetails({ kpiCode, count, details, onChange }: KPIDetailsProps) {
  // Ajuster automatiquement le nombre de détails selon le count
  useEffect(() => {
    // Ne rien faire si déjà à la bonne taille (évite les boucles infinies)
    if (details.length === count) return;

    if (count === 0) {
      // Si count = 0, vider les détails
      if (details.length > 0) {
        onChange([]);
      }
      return;
    }

    // Si on a moins de détails que nécessaire, CONSERVER les existants et en créer des vides
    if (details.length < count) {
      const newDetails = [...details]; // ✅ CONSERVE les détails existants
      for (let i = details.length; i < count; i++) {
        newDetails.push(createEmptyDetail());
      }
      onChange(newDetails);
    }
    // Si on a trop de détails, CONSERVER les premiers et supprimer les derniers
    else if (details.length > count) {
      onChange(details.slice(0, count)); // ✅ CONSERVE les N premiers
    }
  }, [count, details.length]); // Ajout de details.length pour détecter les changements

  const createEmptyDetail = () => {
    const id = generateId();
    switch (kpiCode) {
      case 'rdv_pris':
      case 'rdv_faits':
      case 'rdv_df':
        return { id, entreprise: '', contact: '' };
      case 'prez':
        return { id, entreprise: '', candidat: '' };
      case 'ref':
        return { id, entreprise: '', contact: '', candidat: '' };
      case 'besoins':
        return { id, entreprise: '', profilRecherche: '' };
      case 'signatures':
        return { id, entreprise: '', contactClient: '', consultant: '' };
      default:
        return { id };
    }
  };

  const handleDetailChange = (index: number, field: string, value: string) => {
    const newDetails = [...details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    onChange(newDetails);
  };

  const renderDetailCard = (detail: any, index: number) => {
    const cardNumber = `${index + 1}/${count}`;

    const renderFields = () => {
      switch (kpiCode) {
        case 'rdv_pris':
        case 'rdv_faits':
        case 'rdv_df':
          return (
            <>
              <input
                type="text"
                placeholder="Entreprise"
                value={detail.entreprise || ''}
                onChange={(e) => handleDetailChange(index, 'entreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Contact"
                value={detail.contact || ''}
                onChange={(e) => handleDetailChange(index, 'contact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </>
          );

        case 'prez':
          return (
            <>
              <input
                type="text"
                placeholder="Entreprise"
                value={detail.entreprise || ''}
                onChange={(e) => handleDetailChange(index, 'entreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Candidat présenté"
                value={detail.candidat || ''}
                onChange={(e) => handleDetailChange(index, 'candidat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </>
          );

        case 'ref':
          return (
            <>
              <input
                type="text"
                placeholder="Entreprise"
                value={detail.entreprise || ''}
                onChange={(e) => handleDetailChange(index, 'entreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Contact"
                value={detail.contact || ''}
                onChange={(e) => handleDetailChange(index, 'contact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Candidat (pour qui la REF)"
                value={detail.candidat || ''}
                onChange={(e) => handleDetailChange(index, 'candidat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </>
          );

        case 'besoins':
          return (
            <>
              <input
                type="text"
                placeholder="Entreprise"
                value={detail.entreprise || ''}
                onChange={(e) => handleDetailChange(index, 'entreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Profil recherché"
                value={detail.profilRecherche || ''}
                onChange={(e) => handleDetailChange(index, 'profilRecherche', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </>
          );

        case 'signatures':
          return (
            <>
              <input
                type="text"
                placeholder="Entreprise"
                value={detail.entreprise || ''}
                onChange={(e) => handleDetailChange(index, 'entreprise', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Contact client"
                value={detail.contactClient || ''}
                onChange={(e) => handleDetailChange(index, 'contactClient', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
              <input
                type="text"
                placeholder="Consultant"
                value={detail.consultant || ''}
                onChange={(e) => handleDetailChange(index, 'consultant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              />
            </>
          );

        default:
          return null;
      }
    };

    return (
      <div key={detail.id} className="bg-blue-50 rounded-lg p-3 space-y-2 border-l-4 border-blue-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-700">{cardNumber}</span>
        </div>
        {renderFields()}
      </div>
    );
  };

  // Ne pas afficher ce composant pour les KPI qui n'ont pas de détails
  if (!['rdv_pris', 'rdv_faits', 'rdv_df', 'prez', 'ref', 'besoins', 'signatures'].includes(kpiCode)) {
    return null;
  }

  // Ne rien afficher si count = 0
  if (count === 0) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3 space-y-2">
      <div className="text-xs font-medium text-gray-600 mb-2">
        Détails à renseigner :
      </div>
      {details.map((detail, index) => renderDetailCard(detail, index))}
    </div>
  );
}
