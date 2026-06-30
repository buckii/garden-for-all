#!/usr/bin/env node

/**
 * Database backup script
 * Creates a dated backup of the MongoDB database using credentials from the
 * environment (MONGODB_URI). Modeled on ../buckeye-cards/scripts/db-backup.cjs.
 *
 * Usage:
 *   npm run db:backup                        # uses MONGODB_URI from .env
 *   MONGODB_URI="<prod-uri>" npm run db:backup   # back up a specific database
 *
 * The backup goes to ./backup/<dbname>-<timestamp>/ so backups never clobber
 * each other and you can tell local vs. production backups apart.
 */

const { execSync } = require('child_process')
const fs = require('fs')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables')
  console.error('Set it in .env, or pass it inline:')
  console.error('  MONGODB_URI="<uri>" npm run db:backup')
  process.exit(1)
}

// Pull a human-readable host + db name out of the URI for labeling (no creds).
function describeTarget(uri) {
  try {
    const u = new URL(uri)
    const db = u.pathname.replace(/^\//, '') || 'unknown-db'
    return { host: u.host, db }
  } catch {
    return { host: 'unknown-host', db: 'unknown-db' }
  }
}

const { host, db } = describeTarget(MONGODB_URI)

// Timestamp like 2026-06-30T14-22-05 (filesystem-safe).
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '')
const backupPath = `./backup/${db}-${timestamp}`

if (!fs.existsSync('./backup')) {
  fs.mkdirSync('./backup')
}

console.log(`📦 Creating database backup...`)
console.log(`🎯 Target:   ${host}/${db}`)
console.log(`📂 Location: ${backupPath}`)

try {
  // --gzip keeps backups compact; restore script reads gzipped dumps too.
  execSync(`mongodump --uri="${MONGODB_URI}" --gzip --out="${backupPath}"`, {
    stdio: 'inherit'
  })
  console.log(`\n✅ Backup completed successfully!`)
  console.log(`📁 Backup saved to: ${backupPath}`)
} catch (error) {
  console.error('❌ Backup failed:', error.message)
  process.exit(1)
}
