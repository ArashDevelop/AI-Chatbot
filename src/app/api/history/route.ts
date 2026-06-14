import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const conversation = await prisma.conversation.findUnique({ where: { id } })
      if (!conversation) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      return Response.json(conversation)
    }

    const conversations = await prisma.conversation.findMany({
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ conversations })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, messages } = await req.json()

    if (!messages) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: { title: title || 'New Chat', messages },
    })

    return Response.json(conversation, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
