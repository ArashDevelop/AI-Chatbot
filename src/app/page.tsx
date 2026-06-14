'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { Sidebar } from '@/components/Sidebar'
import { ModelSelector } from '@/components/ModelSelector'
import type { ChatMessage as ChatMessageType } from '@/lib/openrouter'

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<{ id: string; name: string }[]>([])
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<{ id: string; title: string }[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  useEffect(() => {
    fetch('/api/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.models?.length) {
          setModels(data.models)
          if (!model) setModel(data.models[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const sendMessage = async (content: string) => {
    setError('')
    const userMessage: ChatMessageType = { role: 'user', content }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setStreamingContent('')

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, model }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Request failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

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
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              setError(parsed.error)
              continue
            }
            if (parsed.content) {
              fullContent += parsed.content
              setStreamingContent(fullContent)
            }
          } catch {
            // skip malformed
          }
        }
      }

      const finalMessages = [...messages, userMessage, { role: 'assistant' as const, content: fullContent }]
      setMessages(finalMessages)
      setStreamingContent('')
      saveConversation(finalMessages)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setMessages((prev) => [...prev, { role: 'assistant', content: streamingContent }])
        setStreamingContent('')
        return
      }
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  const saveConversation = useCallback(async (msgs: ChatMessageType[]) => {
    try {
      const title = msgs.find((m) => m.role === 'user')?.content.slice(0, 60) || 'New Chat'

      if (currentConvId) {
        await fetch('/api/history', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentConvId, title, messages: msgs }),
        })
        setConversations((prev) =>
          prev.map((c) => (c.id === currentConvId ? { ...c, title } : c))
        )
      } else {
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages: msgs }),
        })
        if (res.ok) {
          const saved = await res.json()
          setCurrentConvId(saved.id)
          setConversations((prev) => [
            { id: saved.id, title: saved.title, createdAt: saved.createdAt },
            ...prev,
          ])
        }
      }
    } catch {
      // silently fail — history is not critical
    }
  }, [currentConvId])

  const stopGeneration = () => {
    abortRef.current?.abort()
  }

  const newChat = () => {
    setMessages([])
    setStreamingContent('')
    setError('')
    setCurrentConvId(null)
  }

  const selectConversation = (id: string) => {
    fetch(`/api/history?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages)
          setCurrentConvId(id)
        }
      })
      .catch(() => {})
    setSidebarOpen(false)
  }

  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.ok ? res.json() : { conversations: [] })
      .then((data) => {
        if (data.conversations) setConversations(data.conversations)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        onSelect={selectConversation}
        onNewChat={newChat}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 h-14 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <ModelSelector selected={model} onSelect={setModel} models={models} />
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-400">Send a message to start chatting</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {(streamingContent || isLoading) && (
              <ChatMessage
                message={{ role: 'assistant', content: streamingContent || '' }}
                isStreaming
              />
            )}

            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput
          onSend={sendMessage}
          onStop={stopGeneration}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
