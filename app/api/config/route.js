// GET /api/config -> expose la clé utilisateur
export async function GET() {
  return new Response(
    JSON.stringify({
      USER_KEY: process.env.USER_KEY || 'user_default'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}