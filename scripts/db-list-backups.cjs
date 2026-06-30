#!/usr/bin/env node

/**
 * List available database backups in ./backup, newest first.
 * Modeled on ../buckeye-cards/scripts/db-list-backups.cjs.
 *
 * Usage: npm run db:list-backups
 */

const fs = require('fs')

const backupDir = './backup'

if (!fs.existsSync(backupDir)) {
  console.log('No backups found (./backup does not exist yet).')
  process.exit(0)
}

const entries = fs
  .readdirSync(backupDir)
  .filter((name) => fs.statSync(`${backupDir}/${name}`).isDirectory())
  .sort()
  .reverse()

if (entries.length === 0) {
  console.log('No backups found.')
  process.exit(0)
}

console.log(`\n📁 Available backups (${entries.length}):\n`)
for (const name of entries) {
  console.log(`  • ${name}`)
}
console.log('\nRestore with: npm run db:restore <backup-folder-name>\n')
