'use client'

import { useState, useEffect } from 'react'

export function ModelSelector({
  selected,
  onSelect,
  models,
}: {
  selected: string
  onSelect: (model: string) => void
  models: { id: string; name: string }[]
}) {
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}
