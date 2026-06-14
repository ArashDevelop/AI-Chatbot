'use client'

export function Sidebar({
  open,
  conversations,
  onSelect,
  onNewChat,
  onClose,
}: {
  open: boolean
  conversations: { id: string; title: string }[]
  onSelect: (id: string) => void
  onNewChat: () => void
  onClose: () => void
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">History</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewChat()
              onClose()
            }}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {conversations.length === 0 && (
            <p className="text-sm text-zinc-400 text-center py-8">No conversations yet</p>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors truncate"
            >
              {conv.title}
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
