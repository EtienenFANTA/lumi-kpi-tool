import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '../lib/session';

/**
 * API Route : Enregistrer une semaine
 *
 * Fait le pont entre le frontend et le webhook N8N
 * Ajoute automatiquement le header d'authentification
 * Protégé par session cookie
 */
export async function POST(request: NextRequest) {
  // Vérifier la session avant tout traitement
  const sessionError = await requireSession(request);
  if (sessionError) return sessionError;

  try {
    // Récupérer les données du body
    const body = await request.json();

    // Valider les paramètres obligatoires
    const { annee, semaine, personne, env, modifie_par } = body;

    if (!annee || !semaine || !personne || !env || !modifie_par) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres manquants',
          message: 'annee, semaine, personne, env et modifie_par sont obligatoires'
        },
        { status: 400 }
      );
    }

    // Construire la requête vers N8N
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    const apiKey = process.env.N8N_API_KEY;

    if (!webhookUrl || !apiKey) {
      console.error('Variables d\'environnement manquantes');
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration serveur manquante',
          message: 'N8N_WEBHOOK_URL ou N8N_API_KEY non configurés'
        },
        { status: 500 }
      );
    }

    // Préparer les données pour N8N (12 KPI + métadonnées)
    const kpiData = {
      action: 'enregistrer',
      annee,
      semaine,
      personne,
      env,
      modifie_par,
      // Les 12 KPI (optionnels, peuvent être null)
      appels: body.appels ?? null,
      rdv_pris: body.rdv_pris ?? null,
      conversion: body.conversion ?? null,
      rdv_faits: body.rdv_faits ?? null,
      prez: body.prez ?? null,
      rdv_df: body.rdv_df ?? null,
      besoins: body.besoins ?? null,
      candidats: body.candidats ?? null,
      cv_envoyes: body.cv_envoyes ?? null,
      prospection: body.prospection ?? null,
      ref: body.ref ?? null,
      signatures: body.signatures ?? null,
      // Champs additionnels
      commentaire_general: body.commentaire_general ?? null,
      details_json: body.details_json ?? null,
    };

    // Appeler le webhook N8N avec authentification
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(kpiData),
    });

    // Récupérer le texte de la réponse
    const responseText = await response.text();

    // Vérifier si la réponse est vide
    if (!responseText || responseText.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Réponse vide de N8N',
          message: 'Le webhook N8N a retourné une réponse vide'
        },
        { status: 502 }
      );
    }

    // Parser le JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erreur parsing JSON N8N:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: 'Format de réponse invalide',
          message: 'Le webhook N8N a retourné une réponse non-JSON'
        },
        { status: 502 }
      );
    }

    // Vérifier si N8N a retourné une erreur
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur webhook N8N',
          message: data.message || 'Erreur inconnue',
          statusCode: response.status
        },
        { status: response.status }
      );
    }

    // Retourner les données au frontend
    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur API /api/enregistrer-semaine:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}
