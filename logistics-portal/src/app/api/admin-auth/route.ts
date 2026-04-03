import { NextResponse } from 'next/server'

const FALLBACK_ADMIN_USERNAME = 'Dragon404'
const FALLBACK_ADMIN_PASSWORD = '56920lK'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const submittedUsername = typeof username === 'string' ? username.trim() : ''
    const submittedPassword = typeof password === 'string' ? password : ''

    const adminUsername = process.env.ADMIN_USERNAME?.trim() || FALLBACK_ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD

    if (submittedUsername === adminUsername && submittedPassword === adminPassword) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
}
