import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streamChat, type ChatMessage } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (session.user.active === false) {
      return Response.json({ error: 'Account deactivated' }, { status: 403 })
    }

    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages required' }, { status: 400 })
    }

    const userModels = await prisma.modelAccess.findMany({
      where: { userId: session.user.id },
      select: { modelId: true },
    })

    if (userModels.length > 0) {
      const allowedIds = userModels.map((m) => m.modelId)
      if (model && !allowedIds.includes(model)) {
        return Response.json({ error: 'Model not allowed' }, { status: 403 })
      }
    }

    const systemPrompt: ChatMessage = {
      role: 'system',
      content: 'You are a helpful, knowledgeable AI assistant. Provide clear, concise, and accurate responses. Format your responses using Markdown where appropriate (headings, lists, code blocks, etc.). Be friendly and conversational.',
    }
    const messagesWithSystem = [systemPrompt, ...messages]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamChat(messagesWithSystem, model || 'google/gemini-2.0-flash-lite-preview-02-05:free', (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Stream error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
