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
      if (!currentConvId) saveConversation(finalMessages)
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
    } catch {
      // silently fail — history is not critical
    }
  }, [])

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
    <div className="flex h-screen">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        onSelect={selectConversation}
        onNewChat={newChat}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-lg">AI Chatbot</h1>
          <div className="ml-auto">
            <ModelSelector selected={model} onSelect={setModel} models={models} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-zinc-400">
              <p className="text-lg">Send a message to start chatting</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}

          {(streamingContent || isLoading) && (
            <ChatMessage
              message={{ role: 'assistant', content: streamingContent || '...' }}
              isStreaming
            />
          )}

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
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
