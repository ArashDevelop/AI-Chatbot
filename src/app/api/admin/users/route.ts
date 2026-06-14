import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** Admin check helper — returns 401/403 if not admin */
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return Response.json({ error: "Not authenticated" }, { status: 401 })
  if (session.user.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 })
  return null
}

/** GET /api/admin/users — list all users with their model access */
export async function GET() {
  const err = await requireAdmin()
  if (err) return err

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      modelAccess: { select: { modelId: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ users })
}

/** PATCH /api/admin/users — batch update user (active, role, modelAccess) */
export async function PATCH(req: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const { id, active, role, modelIds } = await req.json()

    if (!id) return Response.json({ error: "User id required" }, { status: 400 })

    const updateData: any = {}
    if (typeof active === "boolean") updateData.active = active
    if (role === "USER" || role === "ADMIN") updateData.role = role

    await prisma.user.update({ where: { id }, data: updateData })

    // Update model access if provided
    if (Array.isArray(modelIds)) {
      await prisma.modelAccess.deleteMany({ where: { userId: id } })
      if (modelIds.length > 0) {
        await prisma.modelAccess.createMany({
          data: modelIds.map((modelId: string) => ({ userId: id, modelId })),
        })
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}

/** DELETE /api/admin/users?id=... — removes a user */
export async function DELETE(req: NextRequest) {
  const err = await requireAdmin()
  if (err) return err

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return Response.json({ error: "User id required" }, { status: 400 })

    await prisma.user.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
