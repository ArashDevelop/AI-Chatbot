import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ models: [] })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return Response.json({ models: [] })
    }

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      return Response.json({ models: [] })
    }

    const json = await res.json()

    let freeModels = (json.data || [])
      .filter((m: any) => {
        const p = m.pricing || {}
        return p.prompt === '0' && p.completion === '0'
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    const userModels = await prisma.modelAccess.findMany({
      where: { userId: session.user.id },
      select: { modelId: true },
    })

    if (userModels.length > 0) {
      const allowedIds = new Set(userModels.map((m) => m.modelId))
      freeModels = freeModels.filter((m: any) => allowedIds.has(m.id))
    }

    return Response.json({ models: freeModels })
  } catch {
    return Response.json({ models: [] })
  }
}
