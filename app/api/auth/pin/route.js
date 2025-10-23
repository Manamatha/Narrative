import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPin, comparePin } from '@/app/utils/auth'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Génère un PIN unique (4 chiffres)
function generateUniquePin() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
}

// POST /api/auth/pin
// Body: { action: 'login' | 'create', pin?: 'XXXX' }
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, pin } = body

    if (!action || (action !== 'login' && action !== 'create')) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "login" ou "create"' },
        { status: 400 }
      )
    }

    // 🔓 LOGIN - Utilisateur rentre son PIN
    if (action === 'login') {
      if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
        return NextResponse.json(
          { error: 'PIN invalide. Doit être 4 chiffres' },
          { status: 400 }
        )
      }

  // We store hashedPin in user.pinHash or fallback to old pin field if legacy
  const found = await prisma.user.findMany()
      // Try to find by comparing all users (small scale since PIN is short)
      let matchedUser = null
      for (const u of found) {
        const stored = u.pinHash || u.pin
        if (await comparePin(pin, stored)) { matchedUser = u; break }
      }
      if (!matchedUser) return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
      const user = matchedUser

      // Mise à jour du timestamp d'accès
      await prisma.user.update({ where: { id: user.id }, data: { lastUsed: new Date() } })

      // Log du login
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      const userAgent = request.headers.get('user-agent')
      await prisma.pINLog.create({ data: { userId: user.id, ipAddress, userAgent } })

      // Créer auth token et le retourner (pas de cookie)
      const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      await prisma.authToken.create({ data: { userId: user.id, token } })
      return NextResponse.json({ ok: true, token, message: 'Connecté' })
    }

    // ✨ CREATE - Créer un nouveau compte avec PIN aléatoire
    if (action === 'create') {
      let uniquePin
      let pinExists = true
      let attempts = 0

      // Trouver un PIN unique
      while (pinExists && attempts < 100) {
        uniquePin = generateUniquePin()
        const existing = await prisma.user.findUnique({
          where: { pin: uniquePin }
        })
        pinExists = !!existing
        attempts++
      }

      if (pinExists) {
        return NextResponse.json(
          { error: 'Impossible de générer un PIN unique' },
          { status: 500 }
        )
      }

      const hashed = await hashPin(uniquePin)
      const newUser = await prisma.user.create({ data: { pinHash: hashed } })

      return NextResponse.json({ ok: true, userId: newUser.id, pin: uniquePin, message: 'Nouveau compte créé avec PIN' })
    }

  } catch (error) {
    console.error('❌ Erreur authentification:', error)
    return NextResponse.json(
      { error: `Erreur interne: ${error.message}` },
      { status: 500 }
    )
  }
}

// GET /api/auth/pin - Vérifier si on a une session valide
export async function GET(request) {
  try {
    // read cookie -> token -> user
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(cookieHeader.split(';').map(c => {
      const [k,v] = c.split('=') || ['','']
      return [k.trim(), v ? v.trim() : '']
    }))
    const token = cookies['sessionToken']
    if(!token) return NextResponse.json({ ok:false, error:'Pas de session' }, { status:401 })
    const auth = await prisma.authToken.findUnique({ where: { token } })
    if(!auth) return NextResponse.json({ ok:false, error:'Session invalide' }, { status:401 })
    const user = await prisma.user.findUnique({ where: { id: auth.userId } })
    if(!user) return NextResponse.json({ ok:false, error:'Utilisateur introuvable' }, { status:404 })
    return NextResponse.json({ ok:true, userId: user.id, createdAt: user.createdAt })
  } catch (error) {
    console.error('\u274c Erreur vérification session:', error)
    return NextResponse.json({ error: `Erreur interne: ${error.message}` }, { status: 500 })
  }
}