#!/usr/bin/env node

/**
 * Direct production (re)seed.
 *
 * Invokes the seed-database function handler in-process against whatever
 * MONGODB_URI is set in the environment (.env), reading the LOCAL
 * data/harvestentries.csv. This wipes the produce/order/pantry collections
 * and rebuilds them from the local CSV — see seed-database.cjs for scope.
 *
 * ⚠️  DESTRUCTIVE. Always run `npm run db:backup` first.
 *
 * Usage:
 *   npm run seed:prod -- --confirm
 *
 * Requires the --confirm flag so it can never run by accident.
 */

require('dotenv').config()

const uri = process.env.MONGODB_URI || ''
let host = 'unknown'
try {
  host = new URL(uri).host
} catch {
  /* leave as unknown */
}

const confirmed = process.argv.includes('--confirm')

console.log('\n🌱 Garden For All - DIRECT DB Reseed (clear + all historical)\n')
console.log(`🎯 Target database host: ${host}`)
console.log(`📄 Source CSV:           data/harvestentries.csv (local)\n`)

if (!uri) {
  console.error('❌ MONGODB_URI is not set. Put it in .env first.')
  process.exit(1)
}

if (!confirmed) {
  console.error('⛔ Refusing to run without explicit confirmation.')
  console.error('   This DROPS and rebuilds produce/order/pantry collections on the target above.')
  console.error('   Make sure you have a backup (npm run db:backup), then re-run:')
  console.error('     npm run seed:prod -- --confirm')
  process.exit(1)
}

;(async () => {
  // Required after dotenv so the handler's module-load CSV read uses local data.
  const seed = require('../netlify/functions/seed-database.cjs')

  console.log('🔄 Clearing and reseeding...\n')
  const event = {
    httpMethod: 'POST',
    body: JSON.stringify({ clearData: true, allHistoricalData: true })
  }

  try {
    const result = await seed.handler(event, {})
    const body = (() => {
      try {
        return JSON.parse(result.body)
      } catch {
        return result.body
      }
    })()

    if (result.statusCode === 200 && body && body.success) {
      console.log('✅ Reseed complete.\n')
      if (body.summary) {
        Object.entries(body.summary).forEach(([k, v]) => console.log(`  - ${k}: ${v}`))
      }
      process.exit(0)
    } else {
      console.error(`❌ Reseed failed (status ${result.statusCode}):`)
      console.error(body)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Reseed threw an error:', error.message)
    process.exit(1)
  }
})()
