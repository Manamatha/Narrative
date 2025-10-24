import prisma from '@/app/lib/prisma'
import bcrypt from 'bcryptjs'

// Cette fonction est utilisée côté serveur (dans les routes API)
export async function hashPin(pin){
  const salt = await bcrypt.genSalt(8)
  return await bcrypt.hash(pin, salt)
}

// Cette fonction est utilisée côté serveur (dans les routes API)
export async function comparePin(pin, hash){
  if(!hash) return false
  // If stored value looks like a bcrypt hash
  if(typeof hash === 'string' && hash.startsWith('$2')){
    return await bcrypt.compare(pin, hash)
  }
  // fallback to direct compare (legacy)
  return pin === hash
}

// Cette fonction est utilisée côté serveur (dans les routes API)
export async function getUserIdFromRequest(request){
  // Lire le token depuis le cookie sessionToken
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, v] = c.split('=') || ['', '']
      return [k.trim(), v ? v.trim() : '']
    })
  )
  const token = cookies['sessionToken']

  if(!token) return null

  // Utilise le singleton Prisma
  const auth = await prisma.authToken.findUnique({ where: { token } })
  return auth ? auth.userId : null
}

// Utilitaires de déconnexion (nécessaire côté client)
// NOTE: Côté client, nous utiliserons la fonction pour effacer le cookie.
export async function clientLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            console.log("Déconnexion réussie côté client.");
            return true;
        } else {
            console.error("Échec de la déconnexion côté client.");
            return false;
        }
    } catch (error) {
        console.error("Erreur réseau lors de la déconnexion:", error);
        return false;
    }
}
