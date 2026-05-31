const DEFAULT_TIMEOUT_MS = 10000

export function getMediaDuration(file, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    let settled = false

    const cleanup = () => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      video.load()
    }

    const finish = (handler) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      cleanup()
      handler()
    }

    const timer = setTimeout(() => {
      finish(() => reject(new Error('Timed out while reading media duration')))
    }, timeoutMs)

    video.onloadedmetadata = () => {
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) {
        finish(() => reject(new Error('Invalid media duration')))
        return
      }
      finish(() => resolve(duration))
    }

    video.onerror = () => {
      finish(() => reject(new Error('Failed to load media file')))
    }

    video.src = url
  })
}
