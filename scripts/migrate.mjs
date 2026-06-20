#!/usr/bin/env node
/**
 * Supabase migration runner — uses the Management API to execute SQL files.
 *
 * Usage:
 *   node scripts/migrate.mjs                  # run all pending migrations
 *   node scripts/migrate.mjs --file 20260621  # run one specific file (prefix match)
 *   npm run migrate
 *
 * Tracks applied migrations in a `schema_migrations` table that is created
 * automatically on first run. Safe to run repeatedly — already-applied
 * migrations are skipped.
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Config ────────────────────────────────────────────────────────────────────
// Load PAT from environment. Set SUPABASE_PAT in your shell or in a local
// .env file (which is gitignored). Get a token at:
// https://app.supabase.com/account/tokens
function loadPat() {
  if (process.env.SUPABASE_PAT) return process.env.SUPABASE_PAT
  // Try loading from .env in project root
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
    const match   = envFile.match(/^SUPABASE_PAT=(.+)$/m)
    if (match) return match[1].trim()
  } catch { /* .env may not exist */ }
  console.error('Error: SUPABASE_PAT is not set.')
  console.error('Add it to your shell environment or to a .env file in the project root.')
  console.error('Get a token at: https://app.supabase.com/account/tokens')
  process.exit(1)
}

const PROJECT_REF = 'cxklsqbtmhxapebaqrlh'
const PAT         = loadPat()
const API_BASE    = `https://api.supabase.com/v1/projects/${PROJECT_REF}`
const HEADERS     = {
  'Authorization': `Bearer ${PAT}`,
  'Content-Type':  'application/json',
}
const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations')

// ── Management API helper ─────────────────────────────────────────────────────
async function sql(query) {
  const res = await fetch(`${API_BASE}/database/query`, {
    method:  'POST',
    headers: HEADERS,
    body:    JSON.stringify({ query }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = body?.message ?? body?.error ?? JSON.stringify(body)
    throw new Error(`SQL error (${res.status}): ${msg}`)
  }
  return body
}

// ── Bootstrap tracking table ──────────────────────────────────────────────────
async function ensureTrackingTable() {
  await sql(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version    text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function appliedVersions() {
  const rows = await sql(`SELECT version FROM public.schema_migrations ORDER BY version`)
  return new Set(rows.map(r => r.version))
}

async function markApplied(version) {
  await sql(`
    INSERT INTO public.schema_migrations (version)
    VALUES ('${version}')
    ON CONFLICT (version) DO NOTHING
  `)
}

// ── Run a single .sql file ────────────────────────────────────────────────────
async function runFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  // Split on statement boundaries while preserving $$ blocks.
  // Strategy: send the whole file as a single query — Postgres handles it.
  await sql(content)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗 Connecting to Supabase Management API…')
  await ensureTrackingTable()

  const allFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  // --seed-history: mark every migration file as applied without running SQL.
  // Use once when bootstrapping the tracker against an already-migrated DB.
  if (process.argv.includes('--seed-history')) {
    console.log('📋 Seeding migration history (marking all files as applied)…')
    for (const file of allFiles) {
      const version = file.replace('.sql', '')
      await markApplied(version)
      console.log(`  ✓ marked: ${file}`)
    }
    console.log('✅ History seeded. Run `npm run migrate` to apply new migrations.')
    return
  }

  const applied = await appliedVersions()

  // Resolve which files to run
  const fileArg = process.argv.find(a => a.startsWith('--file='))?.split('=')[1]

  const pending = allFiles.filter(f => {
    const version = f.replace('.sql', '')
    if (fileArg && !version.startsWith(fileArg)) return false
    if (applied.has(version)) {
      console.log(`  ↩  already applied: ${f}`)
      return false
    }
    return true
  })

  if (pending.length === 0) {
    console.log('✅ No pending migrations.')
    return
  }

  for (const file of pending) {
    const version  = file.replace('.sql', '')
    const filePath = path.join(MIGRATIONS_DIR, file)
    console.log(`→  Applying ${file}…`)
    try {
      await runFile(filePath)
      await markApplied(version)
      console.log(`  ✓ ${file} applied`)
    } catch (err) {
      console.error(`  ✗ ${file} FAILED: ${err.message}`)
      process.exit(1)
    }
  }

  console.log(`\n✅ Done — ${pending.length} migration(s) applied.`)
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
