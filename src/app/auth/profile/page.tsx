"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import Link from "next/link"

/** Profile page — view name/email, change password */
export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data)
          setName(data.name || "")
        } else {
          router.push("/auth/login")
        }
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false))
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")

    try {
      const body: any = {}
      if (name !== profile.name) body.name = name
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      if (Object.keys(body).length === 0) {
        setError("Nothing to update")
        return
      }

      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Update failed")
      }

      setMessage("Profile updated")
      setCurrentPassword("")
      setNewPassword("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    }
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
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            &larr; Back
          </Link>
          <h1 className="text-sm font-semibold">Profile</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Email</span>
            <span className="text-sm font-medium">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Role</span>
            <span className="text-sm font-medium">{profile?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-500">Status</span>
            <span className={`text-sm font-medium ${profile?.active ? "text-emerald-600" : "text-red-500"}`}>
              {profile?.active ? "Active" : "Deactivated"}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold">Edit profile</h2>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-4 py-2.5 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Save changes
          </button>
        </form>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full rounded-xl border border-red-200 dark:border-red-900 text-red-500 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
