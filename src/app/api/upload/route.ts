import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv']
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ error: 'File type not supported' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name}`
    const publicDir = process.cwd() + '/public/uploads'

    const fs = await import('fs/promises')
    await fs.mkdir(publicDir, { recursive: true })
    await fs.writeFile(`${publicDir}/${filename}`, buffer)

    return Response.json({
      url: `/uploads/${filename}`,
      filename: file.name,
    }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: message }, { status: 500 })
  }
}
