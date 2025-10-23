import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function hashPin(pin){
  const salt = await bcrypt.genSalt(8)
  return bcrypt.hash(pin, salt)
}

export async function comparePin(pin, hash){
  if(!hash) return false
  // If stored value looks like a bcrypt hash
  if(typeof hash === 'string' && hash.startsWith('$2')){
    return bcrypt.compare(pin, hash)
  }
  // fallback to direct compare (legacy)
  return pin === hash
}

export async function getUserIdFromRequest(request){
  // Lire le token depuis Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace('Bearer ', '')

  if(!token) return null

  const auth = await prisma.authToken.findUnique({ where: { token } })
  return auth ? auth.userId : null
}
