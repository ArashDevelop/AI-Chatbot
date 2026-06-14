import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** GET /api/auth/profile — returns current user's profile */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  })

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 })
  }

  return Response.json(user)
}

/** PUT /api/auth/profile — updates name or password */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const { name, currentPassword, newPassword } = await req.json()
    const updateData: any = {}

    if (name) updateData.name = name

    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } })
      if (!user || !user.hashedPassword) {
        return Response.json({ error: "Cannot change password for this account" }, { status: 400 })
      }

      const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)
      if (!isValid) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      updateData.hashedPassword = await bcrypt.hash(newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true },
    })

    return Response.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
