import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/sessions → récupère toutes les sessions
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
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

// POST /api/sessions → création ou mise à jour
export async function POST(req) {
  try {
    const body = await req.json()

    const session = body.id
      ? await prisma.session.update({
          where: { id: body.id },
          data: {
            name: body.name,
            lastAccessed: new Date(),
            campaignData: body.campaignData,
          },
        })
      : await prisma.session.create({
          data: {
            name: body.name || 'Nouvelle session',
            campaignData: body.campaignData || {},
          },
        })

    return new Response(JSON.stringify({ ok: true, session }), { status: 200 })
  } catch (err) {
    console.error('Erreur POST sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

// DELETE /api/sessions → suppression d’une session
export async function DELETE(req) {
  try {
    const { id } = await req.json()
    if (!id) throw new Error('ID manquant')

    await prisma.session.delete({ where: { id } })

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('Erreur DELETE sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}
