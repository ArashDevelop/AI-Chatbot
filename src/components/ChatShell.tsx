'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Sidebar } from './Sidebar'
import { ModelSelector } from './ModelSelector'
import type { ChatMessage as ChatMessageType } from '@/lib/openrouter'

export function ChatShell({ conversationId }: { conversationId?: string }) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<{ id: string; name: string }[]>([])
  const [model, setModel] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<{ id: string; title: string; createdAt: string }[]>([])
  const [currentConvId, setCurrentConvId] = useState<string | null>(conversationId || null)
  const [loadingChat, setLoadingChat] = useState(!!conversationId)
  const [showModelPicker, setShowModelPicker] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  /** Fetch available free models from OpenRouter on mount */
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

  /** Load conversation messages if navigating to /c/[id] */
  useEffect(() => {
    if (!conversationId) return
    fetch(`/api/history?id=${conversationId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.messages) setMessages(data.messages)
      })
      .catch(() => {})
      .finally(() => setLoadingChat(false))
  }, [conversationId])

  /** Fetch conversations list for sidebar */
  useEffect(() => {
    fetch('/api/history')
      .then((res) => res.ok ? res.json() : { conversations: [] })
      .then((data) => {
        if (data.conversations) setConversations(data.conversations)
      })
      .catch(() => {})
  }, [])

  /** Send message to OpenRouter via /api/chat with streaming */
  const sendMessage = async (content: string) => {
    // Force model selection if user hasn't chosen one
    if (!model) {
      setShowModelPicker(true)
      return
    }

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

      /* Process SSE stream line by line */
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
            if (parsed.error) { setError(parsed.error); continue }
            if (parsed.content) {
              fullContent += parsed.content
              setStreamingContent(fullContent)
            }
          } catch { /* skip malformed chunks */ }
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

  /** Save or update conversation in the database via POST/PUT */
  const saveConversation = useCallback(async (msgs: ChatMessageType[]) => {
    try {
      const title = msgs.find((m) => m.role === 'user')?.content.slice(0, 60) || 'New Chat'

      if (currentConvId) {
        /* Update existing conversation */
        await fetch('/api/history', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentConvId, title, messages: msgs }),
        })
        setConversations((prev) =>
          prev.map((c) => (c.id === currentConvId ? { ...c, title } : c))
        )
      } else {
        /* Create new conversation and navigate to its URL */
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages: msgs }),
        })
        if (res.ok) {
          const saved = await res.json()
          setCurrentConvId(saved.id)
          router.push(`/c/${saved.id}`)
          setConversations((prev) => [
            { id: saved.id, title: saved.title, createdAt: saved.createdAt },
            ...prev,
          ])
        }
      }
    } catch { /* silently fail — history is not critical */ }
  }, [currentConvId, router])

  const stopGeneration = () => { abortRef.current?.abort() }

  /** Delete a conversation and redirect if it was the current one */
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (currentConvId === id) router.push('/')
      }
    } catch { /* silently fail */ }
  }

  const newChat = () => { router.push('/') }

  /* Show loading spinner while auth status resolves */
  if (status === 'loading') {
    return (
      <div className="flex h-screen bg-white dark:bg-zinc-900 items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  /* Redirect to login if not authenticated */
  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  /* Show spinner while loading a conversation from DB */
  if (loadingChat) {
    return (
      <div className="flex h-screen bg-white dark:bg-zinc-900 items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        onNewChat={newChat}
        onDelete={deleteConversation}
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
                <p className="text-sm text-zinc-400">
                  {conversationId ? 'This conversation is empty' : 'Send a message to start chatting'}
                </p>
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

      {/* Pre-chat model picker — forces user to select a model before chatting */}
      {showModelPicker && models.length > 0 && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md space-y-4">
            <h2 className="text-sm font-semibold text-center">Choose your default model</h2>
            <p className="text-xs text-zinc-400 text-center">Select which AI model to use for this conversation.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setShowModelPicker(false) }}
                  className="w-full text-left px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm"
                >
                  {m.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setModel(models[0]?.id || ''); setShowModelPicker(false) }}
              className="w-full text-xs text-zinc-400 hover:text-zinc-600 transition-colors pt-1"
            >
              Use default ({models[0]?.name || 'gpt-oss-120m'})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
