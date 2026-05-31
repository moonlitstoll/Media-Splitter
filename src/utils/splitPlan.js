export function calculateSegments({ splitMode, duration, fileSize, parts, splitSize, splitTime }) {
  if (!duration || duration <= 0) return []

  let totalParts = parts
  let partDuration = duration / parts

  if (splitMode === 'size') {
    const totalSizeMB = fileSize / (1024 * 1024)
    totalParts = Math.max(1, Math.ceil(totalSizeMB / splitSize))
    partDuration = duration / totalParts
  } else if (splitMode === 'time') {
    totalParts = Math.max(1, Math.ceil(duration / splitTime))
    partDuration = splitTime
  }

  const segments = []

  for (let i = 0; i < totalParts; i++) {
    const start = i * partDuration
    let end = (i + 1) * partDuration
    if (end > duration) end = duration
    const segmentDuration = end - start

    if (segmentDuration <= 0) break

    segments.push({ start, duration: segmentDuration })
  }

  return segments
}

export function estimatePartCount({ splitMode, duration, fileSize, parts, splitSize, splitTime }) {
  if (splitMode === 'size') {
    return Math.max(1, Math.ceil((fileSize / (1024 * 1024)) / splitSize))
  }
  if (splitMode === 'time') {
    return Math.max(1, Math.ceil(duration / splitTime))
  }
  return parts
}
