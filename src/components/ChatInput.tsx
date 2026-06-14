'use client'

import { useState, useRef } from 'react'

export function ChatInput({
  onSend,
  onStop,
  isLoading,
}: {
  onSend: (message: string) => void
  onStop: () => void
  isLoading: boolean
}) {
  const [input, setInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setInput((prev) => prev + `\n![${data.filename}](${data.url})`)
    } catch {
      // silently fail
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 shrink-0">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex-1 flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl px-4 py-2 focus-within:bg-zinc-50 dark:focus-within:bg-zinc-800 transition-colors">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isLoading || uploading}
            className="shrink-0 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-40 transition-colors"
            title="Upload file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-400"
            style={{ maxHeight: '160px' }}
          />

          {isLoading ? (
            <button
              onClick={onStop}
              className="shrink-0 p-1.5 text-red-500 hover:text-red-600 transition-colors"
              title="Stop"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="shrink-0 p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
