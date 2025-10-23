// GET /api/config -> Retourne les données de session utilisateur
import { getUserIdFromRequest } from '@/app/utils/auth'

export async function GET(request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return new Response(JSON.stringify({ error: 'Utilisateur non identifié' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  return new Response(JSON.stringify({ userId, authenticated: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
}