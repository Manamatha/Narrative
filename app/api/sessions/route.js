import { PrismaClient } from '@prisma/client'
import { getUserIdFromRequest } from '@/app/utils/auth'

const prisma = new PrismaClient()

// GET /api/sessions -> recupère les sessions de l'utilisateur
export async function GET(req) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastAccessed: 'desc' },
    })

    return new Response(JSON.stringify({ ok: true, sessions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Erreur lecture sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

// POST /api/sessions -> creation ou mise a jour
export async function POST(req) {
  try {
    const body = await req.json()
    const userId = await getUserIdFromRequest(req)
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'userId manquant' }), { status: 400 })

    const session = body.id
      ? await prisma.session.update({
          where: { id: body.id },
          data: {
            name: body.name,
            lastAccessed: new Date(),
            campaign: body.campaign,
          },
        })
      : await prisma.session.create({
          data: {
            userId,
            name: body.name || 'Nouvelle session',
            campaign: body.campaign || '{}',
          },
        })

    return new Response(JSON.stringify({ ok: true, session }), { status: 200 })
  } catch (err) {
    console.error('Erreur POST sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

// DELETE /api/sessions -> suppression d'une session
export async function DELETE(req) {
  try {
    const body = await req.json()
    const { id } = body
    const userId = await getUserIdFromRequest(req)
    if (!id || !userId) return new Response(JSON.stringify({ ok: false, error: 'ID ou userId manquant' }), { status: 400 })

    // Verifier que la session appartient a l'utilisateur
    const session = await prisma.session.findUnique({ where: { id } })
    if (!session || session.userId !== userId) {
      return new Response(JSON.stringify({ ok: false, error: 'Acces refuse' }), { status: 403 })
    }

    await prisma.session.delete({ where: { id } })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('Erreur DELETE sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}