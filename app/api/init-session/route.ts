import { NextResponse } from 'next/server';

/**
 * API Route : Initialiser une session
 *
 * À appeler automatiquement quand l'utilisateur charge l'application
 * Crée un cookie de session HttpOnly pour protéger les API
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'LUMI_KPI_SESSION_SECRET_KEY_CHANGE_IN_PROD';
const SESSION_COOKIE_NAME = 'lumi-kpi-session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 jours

export async function POST() {
  try {
    const sessionData = {
      created: Date.now(),
      expires: Date.now() + SESSION_DURATION,
      secret: SESSION_SECRET,
    };

    const response = NextResponse.json({
      success: true,
      message: 'Session initialisée',
    });

    // Définir le cookie dans la réponse
    response.cookies.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erreur initialisation session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur serveur',
        message: 'Impossible de créer la session',
      },
      { status: 500 }
    );
  }
}
