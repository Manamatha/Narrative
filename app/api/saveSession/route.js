import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserIdFromRequest } from '@/app/utils/auth'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const body = await request.json()
    const { sessionId, campaign } = body

    if (!sessionId || !campaign) {
      return NextResponse.json(
        { error: 'sessionId et campaign requis' },
        { status: 400 }
      )
    }

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non identifié' },
        { status: 401 }
      )
    }

    // Sauvegarder ou mettre à jour la session
    const session = await prisma.session.upsert({
      where: { id: sessionId },
      update: {
        campaign: JSON.stringify(campaign),
        lastAccessed: new Date()
      },
      create: {
        id: sessionId,
        userId,
        name: campaign.name || 'Session',
        campaign: JSON.stringify(campaign)
      }
    })

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      message: 'Session sauvegardée'
    })
  } catch (error) {
    console.error('Erreur sauvegarde session:', error)
    return NextResponse.json(
      { error: `Erreur interne: ${error.message}` },
      { status: 500 }
    )
  }
}
