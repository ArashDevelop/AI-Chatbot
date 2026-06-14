import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Get the authenticated user's ID or return a 401 response */
async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return session.user.id
}

export async function GET(req: NextRequest) {
  const userId = await requireUser()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      const conversation = await prisma.conversation.findUnique({ where: { id } })
      if (!conversation || conversation.userId !== userId) {
        return Response.json({ error: 'Not found' }, { status: 404 })
      }
      return Response.json(conversation)
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId },
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
  const userId = await requireUser()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { title, messages } = await req.json()

    if (!messages) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.create({
      data: { title: title || 'New Chat', messages, userId },
    })

    return Response.json(conversation, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const userId = await requireUser()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { id, title, messages } = await req.json()

    if (!id || !messages) {
      return Response.json({ error: 'id and messages required' }, { status: 400 })
    }

    const existing = await prisma.conversation.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const conversation = await prisma.conversation.update({
      where: { id },
      data: { title: title || undefined, messages },
    })

    return Response.json(conversation)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await requireUser()
  if (!userId) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    const existing = await prisma.conversation.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.conversation.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
