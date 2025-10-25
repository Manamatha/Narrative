import React, { useEffect, useState } from 'react';
// Note: Dans votre projet réel, vous importeriez getMemoryManager et checkSession
// depuis leurs fichiers respectifs. Ici, nous les simulons pour que le fichier
// soit auto-suffisant et exécutable.

// --- Dépendances Simulées (À remplacer par vos importations réelles) ---

// Simulation de l'API de Session
const checkSession = (userId) => {
    return new Promise(resolve => {
        setTimeout(() => {
            console.log(`[API] Session pour l'utilisateur ${userId} confirmée.`);
            resolve({ success: true, user: userId });
        }, 500);
    });
};

// Simulation du MemoryManager
const memoryManagerInstance = {
    _userId: null,
    setUserId(id) {
        this._userId = id;
        console.log(`[MemoryManager] UserId défini sur: ${id}`);
    },
    getUserId() {
        return this._userId;
    }
};

export function getMemoryManager() {
    return memoryManagerInstance;
}

// --- Hook Principal : useSyncSessions.jsx ---

/**
 * Synchronise l'ID utilisateur avec le MemoryManager après une vérification de session réussie.
 * @param {object} authStatus L'objet d'état d'authentification ({isLoggedIn, userId})
 */
export const useSyncSessions = (authStatus) => {
  // Le useEffect s'exécute à chaque fois que l'état de connexion ou l'ID utilisateur change.
  useEffect(() => {
    const manager = getMemoryManager();

    // 1. Condition : L'utilisateur doit être connecté et avoir un ID valide.
    if (authStatus?.isLoggedIn && authStatus?.userId) {
      console.log(`[Hook] Utilisateur connecté. Lancement de checkSession() pour ${authStatus.userId}...`);

      // 2. Lancement de la vérification de la session
      checkSession(authStatus.userId)
        .then(response => {
          if (response.success) {
            console.log('[Hook] Vérification de session réussie.');
            
            // 3. LA LIGNE CLÉ AJOUTÉE ET CORRIGÉE
            manager.setUserId(authStatus.userId);
            
          } else {
            console.error('[Hook] Vérification de session terminée sans succès.');
            // Gestion des cas de succès partiel/échec peut aller ici
          }
        })
        .catch(err => {
          console.error('[Hook] Erreur réseau ou de vérification:', err);
        });
    } else if (authStatus?.isLoggedIn === false) {
        // Optionnel : Réinitialiser l'ID si l'utilisateur se déconnecte explicitement.
        manager.setUserId(null);
    }
    
    // Cleanup du MemoryManager si nécessaire (dépend de votre architecture)
    // Ici, le cleanup n'est pas nécessaire car setUserId écrase simplement la valeur.
    
  }, [authStatus?.isLoggedIn, authStatus?.userId]); // Le hook se re-déclenche si ces valeurs changent.
};

// --- Composant de Démonstration ---

export default function App() {
    // Simule l'état d'authentification
    const [auth, setAuth] = useState({ isLoggedIn: false, userId: 'u-483g-001' });

    // Utilise le hook
    useSyncSessions(auth);

    const handleLogin = () => {
        setAuth({ isLoggedIn: true, userId: 'u-483g-001' });
    };

    const handleLogout = () => {
        setAuth({ isLoggedIn: false, userId: 'u-483g-001' });
    };

    return (
        <div className="p-8 max-w-lg mx-auto bg-white min-h-screen font-sans">
            <h1 className="text-3xl font-extrabold mb-6 text-gray-800 border-b pb-2">
                Démonstration de `useSyncSessions`
            </h1>
            
            <div className={`p-5 rounded-xl shadow-lg transition-all duration-300 ${auth.isLoggedIn ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 mb-8`}>
                <p className="font-bold text-lg mb-2 flex items-center">
                    <span className="mr-2">{auth.isLoggedIn ? '✅' : '❌'}</span>
                    État Actuel
                </p>
                <p className="text-gray-700">Connecté: <span className="font-medium">{auth.isLoggedIn ? 'Oui' : 'Non'}</span></p>
                <p className="text-gray-700">ID Utilisateur: <span className="font-mono text-sm">{auth.userId}</span></p>
                <hr className="my-3"/>
                <p className="font-semibold text-gray-800">
                    MemoryManager ID: <span className="font-mono text-sm p-1 bg-white rounded">{getMemoryManager().getUserId() || 'Non défini (Null)'}</span>
                </p>
            </div>

            <div className="flex space-x-4">
                <button
                    onClick={handleLogin}
                    disabled={auth.isLoggedIn}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Simuler la Connexion
                </button>
                <button
                    onClick={handleLogout}
                    disabled={!auth.isLoggedIn}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Simuler la Déconnexion
                </button>
            </div>

            <p className="mt-8 text-xs text-gray-500 text-center">
                Consultez la console de développement. Le `MemoryManager` met à jour son ID utilisateur ~500ms après la &quot;Connexion&quot; (simulant `checkSession`).
            </p>
        </div>
    );
}
