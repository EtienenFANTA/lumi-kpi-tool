import { NextRequest, NextResponse } from 'next/server';

/**
 * Clé secrète pour signer les sessions
 * En production, utiliser une vraie clé secrète dans .env
 */
const SESSION_SECRET = process.env.SESSION_SECRET || 'LUMI_KPI_SESSION_SECRET_KEY_CHANGE_IN_PROD';

/**
 * Nom du cookie de session
 */
const SESSION_COOKIE_NAME = 'lumi-kpi-session';

/**
 * Vérifier qu'une session valide existe
 * À appeler dans chaque API route protégée
 */
export async function verifySession(request: NextRequest): Promise<boolean> {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return false;
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Vérifier que la session n'est pas expirée
    if (sessionData.expires < Date.now()) {
      return false;
    }

    // Vérifier le secret
    if (sessionData.secret !== SESSION_SECRET) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur vérification session:', error);
    return false;
  }
}

/**
 * Middleware de vérification de session
 * Retourne une erreur 401 si la session est invalide
 */
export async function requireSession(request: NextRequest): Promise<NextResponse | null> {
  const isValid = await verifySession(request);

  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Session invalide',
        message: 'Vous devez accéder à l\'application via le site web',
      },
      { status: 401 }
    );
  }

  return null; // Session valide, continuer
}
