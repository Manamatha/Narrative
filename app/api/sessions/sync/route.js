import { PrismaClient } from '@prisma/client'
import { getUserIdFromRequest } from '@/app/utils/auth'

const prisma = new PrismaClient()

/**
 * GET /api/sessions/sync
 * Récupère les sessions modifiées depuis une date donnée
 * Utilisé pour la synchronisation multi-appareils
 */
export async function GET(req) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    // Récupérer le timestamp depuis les query params
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since') ? new Date(searchParams.get('since')) : new Date(0)

    // Récupérer les sessions modifiées depuis 'since'
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        lastAccessed: { gte: since }
      },
      orderBy: { lastAccessed: 'desc' },
    })

    return new Response(JSON.stringify({ 
      ok: true, 
      sessions,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur sync sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

