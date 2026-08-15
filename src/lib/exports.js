// Shared browser-side export helpers used by every admin page.
// Zero dependencies — pure Blob + createObjectURL for CSV, window.print
// with a print-only stylesheet for PDF.

// --- CSV ------------------------------------------------------------

function csvCell(v) {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Trigger a CSV download in the browser.
 * @param {string} filename  e.g. "employees-2026-08-15.csv"
 * @param {string[]} headers e.g. ["Name","Position","Rate"]
 * @param {Array<Array>} rows array of arrays matching headers
 */
export function exportCsv(filename, headers, rows) {
  const body = [headers, ...rows]
    .map((r) => r.map(csvCell).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// --- PDF (via window.print) -----------------------------------------

// Ensure the print-only stylesheet is injected once. Admin pages already
// live inside <main> (see AdminShell); we hide the sidebar/topbar so only
// the content area prints. Rows over multiple pages break cleanly.
function ensurePrintStyles() {
  if (document.getElementById('ts-print-styles')) return
  const style = document.createElement('style')
  style.id = 'ts-print-styles'
  style.textContent = `
    @media print {
      body { background: #fff !important; }
      aside, nav, .no-print { display: none !important; }
      /* Force full-width content when sidebar is hidden */
      main { display: block !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      button { display: none !important; }
    }
  `
  document.head.appendChild(style)
}

/**
 * Print the current page as PDF via the browser's Save-as-PDF flow.
 * User picks the destination — we don't ship a PDF library so the file
 * is real and comes from the browser itself.
 */
export function printPage(_titleForDoc) {
  ensurePrintStyles()
  window.print()
}

// --- Convenience ----------------------------------------------------

export function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
