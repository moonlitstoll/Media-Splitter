import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Upload, Scissors, CheckCircle2, Loader2, Download, AlertCircle, Minus, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

function App() {
  const [loaded, setLoaded] = useState(false)
  const [file, setFile] = useState(null)
  const [parts, setParts] = useState(2)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [progress, setProgress] = useState(0)
  const [resultFiles, setResultFiles] = useState([])
  const [error, setError] = useState('')
  const [fileDuration, setFileDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const ffmpegRef = useRef(new FFmpeg())

  useEffect(() => {
    loadFFmpeg()
  }, [])

  const loadFFmpeg = async () => {
    try {
      setStatus('Initializing system infrastructure...')
      // unpkg 대신 더 안정적인 jsdelivr 사용
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm'
      const ffmpeg = ffmpegRef.current

      ffmpeg.on('log', ({ message }) => {
        console.log(message)
        if (message.includes('error')) setStatus(`Error: ${message.slice(0, 20)}...`)
      })

      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100))
      })

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      })

      setLoaded(true)
      setStatus('')
    } catch (err) {
      console.error('FFmpeg Load Error:', err)
      setError(`Load failed: ${err.message}. This might be a network block or browser compatibility issue. (SharedArrayBuffer needs to be enabled)`)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setResultFiles([])
      setError('')
      const dur = await getDuration(droppedFile)
      setFileDuration(dur)
    }
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResultFiles([])
      setError('')
      const dur = await getDuration(selectedFile)
      setFileDuration(dur)
    }
  }

  const formatTime = (seconds) => {
    if (!seconds) return '0s'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const getDuration = async (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        resolve(video.duration)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const splitMedia = async () => {
    if (!file) return

    setProcessing(true)
    setError('')
    setResultFiles([])

    try {
      const ffmpeg = ffmpegRef.current
      const fileName = file.name
      const fileExt = fileName.split('.').pop()
      const baseName = fileName.replace(`.${fileExt}`, '')

      setStatus('Reading media file...')
      await ffmpeg.writeFile('input', await fetchFile(file))

      setStatus('Analyzing duration...')
      const duration = await getDuration(file)

      const partDuration = duration / parts
      const overlap = 0 // 중복 구간 0초 (스트림 복사 방식을 위해 제거)

      const outputs = []

      for (let i = 0; i < parts; i++) {
        const start = i * partDuration
        const end = (i + 1) * partDuration
        const actualDuration = end - start

        const outputName = `${i + 1}_${baseName}_${i + 1}.${fileExt}`
        setStatus(`Splitting part ${i + 1}... (${Math.round((i / parts) * 100)}%)`)

        // 중복 없이 스트림 복사(-c copy) 수행: 초고속 자르기, 메모리 부하 제로
        await ffmpeg.exec([
          '-ss', start.toString(),
          '-i', 'input',
          '-t', actualDuration.toString(),
          '-c', 'copy',
          '-avoid_negative_ts', '1',
          outputName
        ])

        const data = await ffmpeg.readFile(outputName)
        const blob = new Blob([data.buffer], { type: file.type })
        outputs.push({
          name: outputName,
          url: URL.createObjectURL(blob)
        })
      }

      setResultFiles(outputs)
      setStatus('Done!')
      setProgress(100)
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please check if the file format is valid.')
    } finally {
      setProcessing(false)
    }
  }

  const downloadAll = () => {
    resultFiles.forEach(file => {
      const a = document.createElement('a')
      a.href = file.url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
  }

  return (
    <div className="container">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
      >
        <h1 className="title">Media Splitter</h1>
        <p className="subtitle">Maintain original quality, split precisely as many times as you want.</p>

        {!loaded && !error && (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="text-muted">{status || 'Preparing the system...'}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-5 rounded-2xl mb-6 flex items-start gap-3 text-sm">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold mb-1">System Load Error</p>
              <p className="opacity-80">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-bold underline cursor-pointer"
              >
                Try reloading the page
              </button>
            </div>
          </div>
        )}

        {loaded && (
          <>
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="fileInput"
                type="file"
                hidden
                onChange={handleFileChange}
                accept="video/*,audio/*"
              />
              <Upload className="upload-icon mx-auto" strokeWidth={2.5} />

              <div className="mb-4">
                <p className="font-bold text-lg text-text-main">
                  {file ? file.name : 'Drag and drop or select media'}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Supports MP4, MKV, MP3 (No max size limit)'}
                </p>
              </div>

              <button
                className="upload-btn"
                onClick={() => document.getElementById('fileInput').click()}
              >
                Select File
              </button>
            </div>

            <div className="mt-8">
              <label className="text-sm font-bold text-text-muted mb-3 block">Select Split Options</label>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {file && (
                  <>
                    <div className="info-badge total-info">
                      Total: <span className="font-black ml-1">{formatTime(fileDuration)}</span>
                      <span className="mx-1">/</span>
                      <span className="font-black">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <div className="info-badge part-info">
                      Per split approx:
                      <span className="font-black ml-1">
                        {formatTime(fileDuration / parts)}
                      </span>
                      <span className="mx-1">/</span>
                      <span className="font-black">
                        {((file.size / parts) / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="counter-section">
                <div className="counter-container">
                  <button
                    className="counter-btn"
                    onClick={() => setParts(Math.max(2, parts - 1))}
                    disabled={processing || parts <= 2}
                  >
                    <Minus size={20} />
                  </button>
                  <div className="counter-value">
                    <span className="number">{parts}</span>
                    <span className="unit">Parts</span>
                  </div>
                  <button
                    className="counter-btn"
                    onClick={() => setParts(parts + 1)}
                    disabled={processing}
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {processing && (
              <div className="progress-container">
                <p className="status-text font-semibold">{status}</p>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!processing && resultFiles.length === 0 && (
              <button
                className="split-btn mt-6"
                disabled={!file}
                onClick={splitMedia}
              >
                <Scissors size={20} strokeWidth={2.5} />
                Start Splitting
              </button>
            )}

            {resultFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <div className="flex items-center justify-center gap-2 text-accent mb-6 font-bold text-lg">
                  <CheckCircle2 size={24} />
                  Split Complete!
                </div>

                <div className="space-y-3 mb-6">
                  {resultFiles.map((f, i) => (
                    <div key={i} className="result-item">
                      <span className="truncate flex-1 mr-4 font-medium text-sm">{f.name}</span>
                      <a href={f.url} download={f.name} className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1">
                        <Download size={14} /> Download
                      </a>
                    </div>
                  ))}
                </div>

                <button
                  className="split-btn"
                  onClick={downloadAll}
                >
                  <Download size={20} />
                  Download All
                </button>

                <button
                  className="w-full mt-4 text-text-muted text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => {
                    setResultFiles([])
                    setFile(null)
                    setProgress(0)
                  }}
                >
                  Process another file
                </button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
      <style>{`
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .justify-between { justify-content: space-between; }
        .py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .text-sm { font-size: 0.875rem; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .flex-1 { flex: 1 1 0%; }
        .mr-4 { margin-right: 1rem; }
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .w-full { width: 100%; }
        .space-y-3 > * + * { margin-top: 0.75rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-4 { margin-top: 1rem; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default App
