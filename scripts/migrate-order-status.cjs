#!/usr/bin/env node

/**
 * One-time migration: rename order status 'completed' -> 'delivered'.
 *
 * The order terminal status was renamed from "completed" to "delivered". New
 * orders already use 'delivered'; this converts any pre-rename records so the
 * status filter and badges are consistent. Safe to run multiple times.
 *
 * Usage:
 *   npm run migrate:order-status                          # uses MONGODB_URI from .env
 *   MONGODB_URI="<prod-uri>" npm run migrate:order-status # migrate a specific database
 *
 * ⚠️  Touches production data. Run `npm run db:backup` first.
 */

require('dotenv').config()
const mongoose = require('mongoose')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables')
  console.error('Set it in .env, or pass it inline:')
  console.error('  MONGODB_URI="<uri>" npm run migrate:order-status')
  process.exit(1)
}

let host = 'unknown'
try {
  host = new URL(MONGODB_URI).host
} catch {
  /* leave as unknown */
}

async function run() {
  console.log('\n🔁 Garden For All - Migrate order status: completed -> delivered\n')
  console.log(`🎯 Target database host: ${host}\n`)

  await mongoose.connect(MONGODB_URI)

  // Operate on the raw collection so we don't depend on the (legacy-tolerant) enum.
  const orders = mongoose.connection.collection('orders')

  const before = await orders.countDocuments({ status: 'completed' })
  console.log(`Found ${before} order(s) with status 'completed'.`)

  if (before === 0) {
    console.log('✅ Nothing to migrate.')
    await mongoose.disconnect()
    return
  }

  const result = await orders.updateMany(
    { status: 'completed' },
    { $set: { status: 'delivered' } }
  )

  console.log(`✅ Updated ${result.modifiedCount} order(s) to 'delivered'.`)
  await mongoose.disconnect()
}

run().catch(async (err) => {
  console.error('❌ Migration failed:', err.message)
  try {
    await mongoose.disconnect()
  } catch {
    /* ignore */
  }
  process.exit(1)
})
