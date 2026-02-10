import type { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type TestUser = {
  id?: string
  email?: string
  appMetadata?: Record<string, unknown>
}

function readEnvFileValue(key: string) {
  const envPaths = [
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '.env.local'),
  ]
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue
    const contents = fs.readFileSync(envPath, 'utf8')
    const lines = contents.split(/\r?\n/)
    for (const line of lines) {
      const match = line.match(new RegExp(`^${key}\\s*=\\s*(.+)$`))
      if (match) {
        return match[1].replace(/^['"]|['"]$/g, '').trim()
      }
    }
  }
  return undefined
}

function getSupabaseRef() {
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    readEnvFileValue('VITE_SUPABASE_URL') ||
    'https://placeholder.supabase.co'
  try {
    const host = new URL(url).hostname
    const ref = host.split('.')[0]
    return ref || 'placeholder'
  } catch {
    return 'placeholder'
  }
}

export async function injectSupabaseSession(
  page: Page,
  user: TestUser = {}
) {
  const supabaseRef = getSupabaseRef()
  const storageKey = `sb-${supabaseRef}-auth-token`
  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresAt = nowSeconds + 60 * 60 * 24
  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: expiresAt - nowSeconds,
    expires_at: expiresAt,
    user: {
      id: user.id ?? 'test-user-id',
      email: user.email ?? 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: user.appMetadata ?? {},
    },
  }

  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value)
    },
    [storageKey, JSON.stringify(session)]
  )
}
