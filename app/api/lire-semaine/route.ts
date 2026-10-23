import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '../lib/session';

/**
 * API Route : Lire une semaine
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
    const { annee, semaine, personne, env } = body;

    if (!annee || !semaine || !personne || !env) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paramètres manquants',
          message: 'annee, semaine, personne et env sont obligatoires'
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

    // Appeler le webhook N8N avec authentification
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        action: 'lire',
        annee,
        semaine,
        personne,
        env,
      }),
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
    console.error('Erreur API /api/lire-semaine:', error);
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
