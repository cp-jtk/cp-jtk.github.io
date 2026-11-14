/**
 * Dependency-free CSV parser.
 * Handles quoted fields, escaped quotes, commas inside quotes, CRLF, and
 * trailing empty lines. Returns an array of rows (each row is an array).
 */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const source = String(text ?? '').replace(/^\uFEFF/, '')

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inQuotes) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char === '\r') {
      // Ignore CR; the following LF ends the row.
    } else {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

module.exports = { parseCsv }
