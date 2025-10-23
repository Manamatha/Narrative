import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    // Récupérer le token du cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, v] = c.split('=') || ['', '']
        return [k.trim(), v ? v.trim() : '']
      })
    )
    const token = cookies['sessionToken']
    
    // Supprimer le token de la base de données
    if (token) {
      try {
        await prisma.authToken.delete({ where: { token } })
      } catch (err) {
        // Token n'existe pas, c'est ok
        console.log('Token non trouvé dans la DB')
      }
    }
    
    // Créer la réponse avec le cookie supprimé
    const setCookie = 'sessionToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
    
    return new Response(
      JSON.stringify({ ok: true, message: 'Déconnecté avec succès' }),
      { 
        status: 200, 
        headers: { 
          'Set-Cookie': setCookie,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Erreur déconnexion:', error)
    return NextResponse.json(
      { error: `Erreur: ${error.message}` },
      { status: 500 }
    )
  }
}

