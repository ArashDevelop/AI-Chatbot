"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface User {
  id: string
  name: string | null
  email: string | null
  role: string
  active: boolean
  createdAt: string
  modelAccess: { modelId: string }[]
}

/** Admin panel — manages users, their active status, role, and model access */
export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [models, setModels] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState("USER")
  const [editModelIds, setEditModelIds] = useState<string[]>([])

  const fetchData = async () => {
    const [usersRes, modelsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/models"),
    ])
    if (!usersRes.ok) {
      router.push("/auth/login")
      return
    }
    const usersData = await usersRes.json()
    const modelsData = await modelsRes.json()
    setUsers(usersData.users || [])
    setModels(modelsData.models || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  /** Toggle user active status */
  const toggleActive = async (user: User) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, active: !user.active }),
    })
    if (res.ok) fetchData()
  }

  /** Delete user */
  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" })
    if (res.ok) fetchData()
  }

  /** Start editing a user */
  const startEdit = (user: User) => {
    setEditing(user.id)
    setEditName(user.name || "")
    setEditRole(user.role)
    setEditModelIds(user.modelAccess.map((m) => m.modelId))
  }

  /** Save user edits */
  const saveEdit = async () => {
    if (!editing) return
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing, role: editRole, modelIds: editModelIds }),
    })
    if (res.ok) {
      setEditing(null)
      fetchData()
    }
  }

  /** Toggle a model's access for the user being edited */
  const toggleModel = (modelId: string) => {
    setEditModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              &larr; Back
            </Link>
            <h1 className="text-sm font-semibold">Admin Panel</h1>
          </div>
          <span className="text-xs text-zinc-400">{users.length} users</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3"
          >
            {editing === user.id ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-12">Name:</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm outline-none"
                    disabled
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-12">Role:</span>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm outline-none bg-white dark:bg-zinc-900"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block mb-2">Model access:</span>
                  <div className="flex flex-wrap gap-2">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => toggleModel(m.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          editModelIds.includes(m.id)
                            ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 border-zinc-800 dark:border-zinc-200"
                            : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={saveEdit} className="text-xs bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg font-medium hover:bg-zinc-700 transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="text-xs text-zinc-400 px-3 py-1.5 hover:text-zinc-600 transition-colors">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.name || "Unnamed"}</p>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === "ADMIN" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.active ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    }`}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(user)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggleActive(user)} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                    {user.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="text-xs text-red-400 hover:text-red-500 transition-colors">
                    Remove
                  </button>
                </div>
                {user.modelAccess.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {user.modelAccess.map((ma) => {
                      const m = models.find((m) => m.id === ma.modelId)
                      return m ? (
                        <span key={ma.modelId} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                          {m.name}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
