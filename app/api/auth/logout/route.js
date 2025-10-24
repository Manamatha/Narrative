import { NextResponse } from 'next/server'
// Utilisation du singleton unique de Prisma
import prisma from '@/app/lib/prisma'

export async function POST(request) {
  let token = null;
  try {
    // Récupérer le token du cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, v] = c.split('=') || ['', '']
        return [k.trim(), v ? v.trim() : '']
      })
    )
    token = cookies['sessionToken']
    
    // 1. Supprimer le token de la base de données (si présent)
    if (token) {
      try {
        // Suppression robuste de l'AuthToken
        await prisma.authToken.deleteMany({
          where: { token: token }
        })
      } catch (err) {
        // Ignorer l'erreur si le token n'existe plus
        console.warn('Le token de session n\'a pas pu être supprimé de la DB (peut être déjà expiré):', err.message)
      }
    }
    
    // 2. Supprimer le cookie du navigateur
    const response = NextResponse.json({ ok: true, message: 'Déconnecté avec succès' })
    
    // Utilisation de la méthode de suppression de cookie recommandée
    response.cookies.set('sessionToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expire immédiatement
    })
    
    return response

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error)
    return NextResponse.json(
      { error: `Erreur interne lors de la déconnexion: ${error.message}` },
      { status: 500 }
    )
  }
}
