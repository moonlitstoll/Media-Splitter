export function formatTime(seconds) {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatMegabytes(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1)
}

export function formatMegabytesPrecise(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2)
}
