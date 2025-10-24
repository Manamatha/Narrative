import { NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'
import { hashPin, comparePin } from '@/app/utils/auth'
import crypto from 'crypto'

// Génère un PIN unique (4 chiffres)
function generateUniquePin() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, '0')
}

// POST /api/auth/pin
// Body: { action: 'login' | 'create', pin?: 'XXXX', userKey?: 'user_xxx' }
export async function POST(request) {
  try {
    const body = await request.json()
    const { action, pin, userKey } = body

    if (!action || (action !== 'login' && action !== 'create')) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "login" ou "create"' },
        { status: 400 }
      )
    }

    // 🔓 LOGIN - Utilisateur rentre son PIN ou utilise userKey
    if (action === 'login') {
      // Si userKey est fourni, on l'utilise pour l'authentification
      if (userKey && userKey === process.env.USER_KEY) {
        // Trouver ou créer l'utilisateur avec le USER_KEY
        // FIX: Utilisation de findFirst pour plus de robustesse sur le champ PIN
        let user = await prisma.user.findFirst({
          where: { pin: '0000' }
        });
        
        if (!user) {
          // Créer un utilisateur fixe s'il n'existe pas
          const hashedPin = await hashPin('0000');
          user = await prisma.user.create({
            data: {
              pin: '0000',
              pinHash: hashedPin
            }
          });
        }
        
        // Mise à jour du timestamp d'accès
        await prisma.user.update({ where: { id: user.id }, data: { lastUsed: new Date() } });
        
        // Créer auth token et le retourner via cookie
        const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
        await prisma.authToken.create({ data: { userId: user.id, token } });
        
        // Créer la réponse avec le cookie sécurisé
        const response = NextResponse.json({ ok: true, message: 'Connecté avec USER_KEY' });
        response.cookies.set('sessionToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30 // 30 jours
        });
        return response;
      }
      
      // Vérification PIN standard si userKey n'est pas fourni ou invalide
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
        // Check for stored value existence before comparing
        if (stored && await comparePin(pin, stored)) { matchedUser = u; break }
      }
      if (!matchedUser) return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
      const user = matchedUser

      // Mise à jour du timestamp d'accès
      await prisma.user.update({ where: { id: user.id }, data: { lastUsed: new Date() } })

      // Log du login
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      const userAgent = request.headers.get('user-agent')
      // FIX: Utilisation du bon nom de modèle PINLog
      await prisma.pINLog.create({ data: { userId: user.id, ipAddress, userAgent } }) 

      // Créer auth token et le retourner via cookie
      const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      await prisma.authToken.create({ data: { userId: user.id, token } })
      
      // Créer la réponse avec le cookie sécurisé
      const response = NextResponse.json({ ok: true, message: 'Connecté' })
      response.cookies.set('sessionToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 jours
      })
      return response
    }

    // ✨ CREATE - Créer un nouveau compte avec PIN choisi ou aléatoire
    if (action === 'create') {
      // Si un PIN est fourni, l'utiliser; sinon en générer un
      let uniquePin = pin || null
      
      if (uniquePin) {
        // Valider le PIN fourni
        if (uniquePin.length !== 4 || !/^\d+$/.test(uniquePin)) {
          return NextResponse.json(
            { error: 'PIN invalide. Doit être 4 chiffres' },
            { status: 400 }
          )
        }
        
        // Vérifier que ce PIN n'existe pas déjà
        // FIX: Utilisation de findFirst pour plus de robustesse
        const existing = await prisma.user.findFirst({
          where: { pin: uniquePin }
        })
        if (existing) {
          return NextResponse.json(
            { error: 'Ce PIN est déjà utilisé. Choisissez-en un autre' },
            { status: 400 }
          )
        }
      } else {
        // Générer un PIN aléatoire unique
        let pinExists = true
        let attempts = 0

        while (pinExists && attempts < 100) {
          uniquePin = generateUniquePin()
          // FIX: Utilisation de findFirst pour plus de robustesse
          const existing = await prisma.user.findFirst({
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
      }

      const hashed = await hashPin(uniquePin)
      let newUser
      try {
        newUser = await prisma.user.create({ data: { pin: uniquePin, pinHash: hashed } })
      } catch (dbError) {
        // Constraint violation - le PIN existe déjà (race condition)
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'Ce PIN est déjà utilisé. Choisissez-en un autre' },
            { status: 400 }
          )
        }
        throw dbError
      }
      
      // Créer auth token pour la nouvelle session
      const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      await prisma.authToken.create({ data: { userId: newUser.id, token } })
      
      // Créer la réponse avec le cookie sécurisé
      const response = NextResponse.json({ ok: true, userId: newUser.id, pin: uniquePin, message: 'Nouveau compte créé avec PIN' })
      response.cookies.set('sessionToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 jours
      })
      return response
    }

  } catch (error) {
    console.error('❌ Erreur authentification:', error)
    // S'assurer que l'erreur est bien remontée
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Erreur interne: ${errorMessage}` },
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
    console.error('❌ Erreur vérification session:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Erreur interne: ${errorMessage}` }, { status: 500 })
  }
}
