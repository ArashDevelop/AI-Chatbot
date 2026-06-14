'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage as ChatMessageType } from '@/lib/openrouter'

export function ChatMessage({
  message,
  isStreaming,
}: {
  message: ChatMessageType
  isStreaming?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
          isUser
            ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
            : 'bg-emerald-600 text-white'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-800'
              : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose dark:prose-invert prose-zinc max-w-none prose-sm leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {isStreaming ? message.content || '' : message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && !isStreaming && message.content && (
          <button
            onClick={copyToClipboard}
            className="mt-1.5 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1 px-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}
