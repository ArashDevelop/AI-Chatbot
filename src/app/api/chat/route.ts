import { NextRequest } from 'next/server'
import { streamChat, type ChatMessage } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages required' }, { status: 400 })
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
