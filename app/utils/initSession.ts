/**
 * Utilitaire pour initialiser la session utilisateur
 *
 * À appeler UNE SEULE FOIS au chargement de l'application
 * (par exemple dans un useEffect du layout ou de la page d'accueil)
 */

let sessionInitialized = false;

export async function initSession(): Promise<boolean> {
  // Éviter les appels multiples
  if (sessionInitialized) {
    return true;
  }

  try {
    const response = await fetch('/api/init-session', {
      method: 'POST',
      credentials: 'include', // Important : envoyer les cookies
    });

    if (response.ok) {
      sessionInitialized = true;
      console.log('[Session] Session initialisée avec succès');
      return true;
    } else {
      console.error('[Session] Erreur lors de l\'initialisation');
      return false;
    }
  } catch (error) {
    console.error('[Session] Erreur réseau:', error);
    return false;
  }
}

/**
 * Hook React pour initialiser automatiquement la session
 * Utiliser dans le layout principal de l'application
 */
export function useInitSession() {
  if (typeof window === 'undefined') return; // SSR guard

  // Initialiser au montage du composant
  React.useEffect(() => {
    initSession();
  }, []);
}
