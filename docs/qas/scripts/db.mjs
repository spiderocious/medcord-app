/**
 * db.mjs — MongoDB connection helper for QA scripts.
 *
 * Uses mongoose loaded from the backend's node_modules so we always
 * talk to the same driver version the app uses.
 *
 * Exports:
 *   mongoose   — the connected mongoose instance
 *   connect()  — opens the connection
 *   disconnect() — closes it
 *   col(name)  — convenience shorthand for mongoose.connection.collection(name)
 *
 * CLI: node db.mjs
 */

import { createRequire } from 'module';

const require = createRequire(
  '/Users/feranmi/codebases/2026/medcord-app/apps/main-backend/node_modules/mongoose/index.js',
);

export const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/medcord';

export async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose;
  await mongoose.connect(MONGODB_URI);
  return mongoose;
}

export async function disconnect() {
  await mongoose.disconnect();
}

/**
 * Returns the raw MongoDB collection with the given name.
 * Useful for low-level inserts/drops without a Mongoose model.
 */
export function col(name) {
  return mongoose.connection.collection(name);
}

// ── CLI entry-point ──────────────────────────────────────────────────────────
if (process.argv[1] === new URL(import.meta.url).pathname) {
  try {
    await connect();
    console.log(`Connected to MongoDB: ${MONGODB_URI}`);
    await disconnect();
    console.log('Disconnected. All good.');
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}
