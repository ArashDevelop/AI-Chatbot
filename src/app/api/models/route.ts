import { NextRequest } from 'next/server'

export async function GET() {
  try {
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

    const freeModels = (json.data || [])
      .filter((m: any) => {
        const p = m.pricing || {}
        return p.prompt === '0' && p.completion === '0'
      })
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))

    return Response.json({ models: freeModels })
  } catch {
    return Response.json({ models: [] })
  }
}
