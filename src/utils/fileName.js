export function parseFileName(fileName) {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0) {
    return { baseName: fileName, ext: 'mp4' }
  }
  return {
    baseName: fileName.slice(0, lastDot),
    ext: fileName.slice(lastDot + 1),
  }
}

export function buildOutputName(index, baseName, ext) {
  return `${index}_${baseName}.${ext}`
}
