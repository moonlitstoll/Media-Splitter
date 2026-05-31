import { useCallback, useEffect, useRef, useState } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

const FFMPEG_CORE_VERSION = '0.12.6'
const FFMPEG_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`

export function useFFmpeg() {
  const ffmpegRef = useRef(new FFmpeg())
  const splitContextRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [loadStatus, setLoadStatus] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const setSplitContext = useCallback((context) => {
    splitContextRef.current = context
  }, [])

  useEffect(() => {
    const ffmpeg = ffmpegRef.current

    const load = async () => {
      if (loaded) return

      try {
        setLoadStatus('Initializing system infrastructure...')

        ffmpeg.on('log', ({ message }) => {
          console.log(message)
          if (message.includes('error')) {
            setLoadStatus(`Error: ${message.slice(0, 20)}...`)
          }
        })

        ffmpeg.on('progress', ({ progress: segmentProgress }) => {
          const context = splitContextRef.current
          if (context) {
            const overall = Math.round(((context.index + segmentProgress) / context.total) * 100)
            setProgress(overall)
            return
          }
          setProgress(Math.round(segmentProgress * 100))
        })

        // @ffmpeg/core 0.12.6 dist/esm doesn't have a separate worker file
        await ffmpeg.load({
          coreURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
        })

        setLoaded(true)
        setLoadStatus('')
      } catch (err) {
        console.error('FFmpeg Load Error:', err)
        setError(
          `Load failed: ${err.message}. This might be a network block or browser compatibility issue. (SharedArrayBuffer needs to be enabled)`,
        )
      }
    }

    load()
  }, [])

  return {
    ffmpegRef,
    loaded,
    loadStatus,
    error,
    progress,
    setProgress,
    setSplitContext,
  }
}
