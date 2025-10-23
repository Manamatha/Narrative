import { PrismaClient } from '@prisma/client'
import { getUserIdFromRequest } from '@/app/utils/auth'

const prisma = new PrismaClient()

/**
 * GET /api/sessions/[id]
 * Récupère une session spécifique
 */
export async function GET(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    const { id } = params
    const session = await prisma.session.findUnique({ where: { id } })

    if (!session || session.userId !== userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Accès refusé' }), { status: 403 })
    }

    return new Response(JSON.stringify({ ok: true, session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur GET session:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

/**
 * PUT /api/sessions/[id]
 * Met à jour une session spécifique
 */
export async function PUT(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    const { id } = params
    const body = await req.json()

    // Vérifier que la session appartient à l'utilisateur
    const existing = await prisma.session.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Accès refusé' }), { status: 403 })
    }

    // Mettre à jour la session
    const session = await prisma.session.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        campaign: body.campaign !== undefined ? body.campaign : existing.campaign,
        lastAccessed: new Date(),
      },
    })

    return new Response(JSON.stringify({ ok: true, session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur PUT session:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

/**
 * DELETE /api/sessions/[id]
 * Supprime une session spécifique
 */
export async function DELETE(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    const { id } = params

    // Vérifier que la session appartient à l'utilisateur
    const session = await prisma.session.findUnique({ where: { id } })
    if (!session || session.userId !== userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Accès refusé' }), { status: 403 })
    }

    await prisma.session.delete({ where: { id } })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur DELETE session:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

