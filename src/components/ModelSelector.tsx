'use client'

export function ModelSelector({
  selected,
  onSelect,
  models,
}: {
  selected: string
  onSelect: (model: string) => void
  models: { id: string; name: string }[]
}) {
  if (models.length === 0) return null

  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="text-xs bg-transparent text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 outline-none hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors cursor-pointer"
    >
      {models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}
