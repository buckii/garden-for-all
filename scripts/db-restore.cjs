#!/usr/bin/env node

/**
 * Database restore script
 * Restores MongoDB from a backup created by db-backup.cjs.
 * Modeled on ../buckeye-cards/scripts/db-restore.cjs.
 *
 * Usage:
 *   npm run db:restore <backup-folder-name>
 *   Example: npm run db:restore garden-for-all-prod-2026-06-30T14-22-05
 *
 * To restore into a specific database, set MONGODB_URI inline:
 *   MONGODB_URI="<uri>" npm run db:restore <backup-folder-name>
 *
 * The backup folder argument is REQUIRED to prevent accidental overwrites.
 * --drop is used, so existing collections in the target are dropped first.
 */

const { execSync } = require('child_process')
const fs = require('fs')
require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI
const backupName = process.argv[2]
const backupPath = backupName ? `./backup/${backupName}` : null

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables')
  process.exit(1)
}

function listBackups() {
  try {
    execSync('ls -1 backup/ 2>/dev/null', { stdio: 'inherit' })
  } catch {
    console.error('  (no backups found)')
  }
}

if (!backupPath) {
  console.error('❌ Error: Backup folder name is required')
  console.error('')
  console.error('Usage: npm run db:restore <backup-folder-name>')
  console.error('')
  console.error('Available backups:')
  listBackups()
  process.exit(1)
}

if (!fs.existsSync(backupPath)) {
  console.error(`❌ Error: Backup not found: ${backupName}`)
  console.error('')
  console.error('Available backups:')
  listBackups()
  process.exit(1)
}

// Find the database directory inside the backup.
const dbDirs = fs.readdirSync(backupPath).filter((file) => {
  const fullPath = `${backupPath}/${file}`
  return fs.statSync(fullPath).isDirectory() && !file.startsWith('.')
})

if (dbDirs.length === 0) {
  console.error(`❌ Error: No database directory found in ${backupPath}`)
  process.exit(1)
}

const dbName = dbDirs[0]
const targetHost = (() => {
  try {
    return new URL(MONGODB_URI).host
  } catch {
    return 'unknown'
  }
})()

console.log(`⚠️  WARNING: This will DROP and restore collections in the target database`)
console.log(`📂 Restore source: ${backupPath}`)
console.log(`🗄️  Source DB:     ${dbName}`)
console.log(`🎯 Target:        ${targetHost}`)
console.log('')
console.log(`Press Ctrl+C to cancel, or wait 5 seconds to continue...`)

setTimeout(() => {
  console.log('🔄 Starting restore...')
  try {
    const dbPath = `${backupPath}/${dbName}`
    const command = `mongorestore --uri="${MONGODB_URI}" --gzip --drop --nsInclude="${dbName}.*" "${dbPath}"`
    execSync(command, { stdio: 'inherit' })
    console.log(`✅ Restore completed successfully!`)
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    process.exit(1)
  }
}, 5000)
