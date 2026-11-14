const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_ENV_FILE = path.resolve(__dirname, '..', '..', '.env')

/**
 * Minimal .env loader (no dependency) — same format as dotenv.
 * Existing process.env values always win.
 */
function loadEnv(file = DEFAULT_ENV_FILE) {
  try {
    const content = fs.readFileSync(file, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const raw = trimmed.slice(eq + 1).trim()
      let value = raw
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    // ignore missing .env
  }
}

module.exports = { loadEnv }
