export type KPICode =
  | 'appels'
  | 'rdv_pris'
  | 'conversion'
  | 'rdv_faits'
  | 'prez'
  | 'rdv_df'
  | 'besoins'
  | 'candidats'
  | 'cv_envoyes'
  | 'prospection'
  | 'ref'
  | 'signatures';

export interface KPI {
  code: KPICode;
  libelle: string;
  ordre: number;
  calcule: boolean;
  hasObjectif: boolean;
  infobulle?: string;
}

export interface Objectif {
  personne: string;
  kpi: KPICode;
  valeur: number;
}

export interface Saisie {
  kpi: KPICode;
  valeur: number | null;
  commentaire: string;
  modifiePar?: string;
  modifieLe?: Date;
}

export interface WeekData {
  personne: string;
  annee: number;
  semaine: number;
  saisies: Saisie[];
}

// Liste des 12 KPI
export const KPI_LIST: KPI[] = [
  { code: 'appels', libelle: 'Appels', ordre: 1, calcule: false, hasObjectif: true },
  { code: 'rdv_pris', libelle: 'RDV pris', ordre: 2, calcule: false, hasObjectif: true },
  { code: 'conversion', libelle: 'Conversion appels → RDV', ordre: 3, calcule: true, hasObjectif: true, infobulle: 'Calculé automatiquement : RDV pris ÷ Appels × 100' },
  { code: 'rdv_faits', libelle: 'RDV faits', ordre: 4, calcule: false, hasObjectif: true },
  { code: 'prez', libelle: 'PREZ', ordre: 5, calcule: false, hasObjectif: true, infobulle: 'Présentation d\'un candidat à un client' },
  { code: 'rdv_df', libelle: 'RDV DF', ordre: 6, calcule: false, hasObjectif: true, infobulle: 'RDV Digital Factory - offre de projets au forfait' },
  { code: 'besoins', libelle: 'Nouveaux besoins client', ordre: 7, calcule: false, hasObjectif: true },
  { code: 'candidats', libelle: 'Candidats pris', ordre: 8, calcule: false, hasObjectif: true },
  { code: 'cv_envoyes', libelle: 'CV envoyés', ordre: 9, calcule: false, hasObjectif: true },
  { code: 'prospection', libelle: 'Prospection LinkedIn', ordre: 10, calcule: false, hasObjectif: true },
  { code: 'ref', libelle: 'Prise de REF', ordre: 11, calcule: false, hasObjectif: true, infobulle: 'Contacter un ancien responsable d\'un candidat' },
  { code: 'signatures', libelle: 'Signatures', ordre: 12, calcule: false, hasObjectif: false },
];

// Objectifs par défaut
export const DEFAULT_OBJECTIFS: Objectif[] = [
  // Pierre
  { personne: 'Pierre', kpi: 'appels', valeur: 100 },
  { personne: 'Pierre', kpi: 'rdv_pris', valeur: 4 },
  { personne: 'Pierre', kpi: 'conversion', valeur: 8 },
  { personne: 'Pierre', kpi: 'rdv_faits', valeur: 4 },
  { personne: 'Pierre', kpi: 'prez', valeur: 1 },
  { personne: 'Pierre', kpi: 'rdv_df', valeur: 1 },
  { personne: 'Pierre', kpi: 'besoins', valeur: 2 },
  { personne: 'Pierre', kpi: 'candidats', valeur: 25 },
  { personne: 'Pierre', kpi: 'cv_envoyes', valeur: 15 },
  { personne: 'Pierre', kpi: 'prospection', valeur: 10 },
  { personne: 'Pierre', kpi: 'ref', valeur: 3 },

  // Laura
  { personne: 'Laura', kpi: 'appels', valeur: 120 },
  { personne: 'Laura', kpi: 'rdv_pris', valeur: 4 },
  { personne: 'Laura', kpi: 'conversion', valeur: 8 },
  { personne: 'Laura', kpi: 'rdv_faits', valeur: 4 },
  { personne: 'Laura', kpi: 'prez', valeur: 1 },
  { personne: 'Laura', kpi: 'rdv_df', valeur: 1 },
  { personne: 'Laura', kpi: 'besoins', valeur: 2 },
  { personne: 'Laura', kpi: 'candidats', valeur: 25 },
  { personne: 'Laura', kpi: 'cv_envoyes', valeur: 15 },
  { personne: 'Laura', kpi: 'prospection', valeur: 10 },
  { personne: 'Laura', kpi: 'ref', valeur: 3 },

  // Etienne
  { personne: 'Etienne', kpi: 'appels', valeur: 50 },
  { personne: 'Etienne', kpi: 'rdv_pris', valeur: 4 },
  { personne: 'Etienne', kpi: 'conversion', valeur: 8 },
  { personne: 'Etienne', kpi: 'rdv_faits', valeur: 4 },
  { personne: 'Etienne', kpi: 'prez', valeur: 0 },
  { personne: 'Etienne', kpi: 'rdv_df', valeur: 1 },
  { personne: 'Etienne', kpi: 'besoins', valeur: 1 },
  { personne: 'Etienne', kpi: 'candidats', valeur: 10 },
  { personne: 'Etienne', kpi: 'cv_envoyes', valeur: 5 },
  { personne: 'Etienne', kpi: 'prospection', valeur: 10 },
  { personne: 'Etienne', kpi: 'ref', valeur: 2 },
];
