import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'Admin credentials not configured.' }, { status: 500 })
    }

    if (username === adminUsername && password === adminPassword) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
