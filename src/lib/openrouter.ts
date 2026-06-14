const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function streamChat(
  messages: ChatMessage[],
  model: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
) {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not set')
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': 'AI Chatbot',
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${errorBody}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content || ''
        if (content) onChunk(content)
      } catch {
        // skip malformed chunks
      }
    }
  }
}


