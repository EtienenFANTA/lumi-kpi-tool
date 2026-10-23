// Types pour les détails structurés de chaque KPI

export interface RdvDetail {
  id: string;
  entreprise: string;
  contact: string;
}

export interface PrezDetail {
  id: string;
  entreprise: string;
  candidat: string;
}

export interface RefDetail {
  id: string;
  entreprise: string;
  contact: string;
  candidat: string;
}

export interface BesoinDetail {
  id: string;
  entreprise: string;
  profilRecherche: string;
}

export interface SignatureDetail {
  id: string;
  entreprise: string;
  contactClient: string;
  consultant: string;
}

export type KPIDetail = RdvDetail | PrezDetail | RefDetail | BesoinDetail | SignatureDetail;

export interface KPIDetailsMap {
  rdv_pris: RdvDetail[];
  rdv_faits: RdvDetail[];
  rdv_df: RdvDetail[];
  prez: PrezDetail[];
  ref: RefDetail[];
  besoins: BesoinDetail[];
  signatures: SignatureDetail[];
}

// Helper pour générer un ID unique
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
