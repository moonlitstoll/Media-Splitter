import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { Upload, Scissors, CheckCircle2, Loader2, Download, AlertCircle, Minus, Plus, Lock, ShieldCheck, Clock, HardDrive, Hash, Zap, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

function App() {
  const [loaded, setLoaded] = useState(false)
  const [file, setFile] = useState(null)
  const [splitMode, setSplitMode] = useState('parts')
  const [parts, setParts] = useState(2)
  const [splitSize, setSplitSize] = useState(10)
  const [splitTime, setSplitTime] = useState(60)
  const [encodingMode, setEncodingMode] = useState('compatible')
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
      // Using more stable jsdelivr instead of unpkg
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

      const overlap = 0

      const outputs = []
      let currentParts = parts;
      let currentPartDuration = duration / parts;

      if (splitMode === 'size') {
        const totalSizeMB = file.size / (1024 * 1024);
        currentParts = Math.ceil(totalSizeMB / splitSize);
        if (currentParts < 1) currentParts = 1;
        currentPartDuration = duration / currentParts;
      } else if (splitMode === 'time') {
        currentParts = Math.ceil(duration / splitTime);
        if (currentParts < 1) currentParts = 1;
        currentPartDuration = splitTime;
      } else {
        currentParts = parts;
        currentPartDuration = duration / parts;
      }

      for (let i = 0; i < currentParts; i++) {
        const start = i * currentPartDuration;
        let end = (i + 1) * currentPartDuration;
        if (end > duration) end = duration;
        const actualDuration = end - start;

        if (actualDuration <= 0) break;

        const outputName = `${i + 1}_${baseName}_${i + 1}.${fileExt}`;
        setStatus(`Splitting part ${i + 1} of ${currentParts}... (${Math.round((i / currentParts) * 100)}%)`);

        // Build ffmpeg arguments based on encoding mode
        const ffmpegArgs = ['-ss', start.toString(), '-i', 'input', '-t', actualDuration.toString()]

        if (encodingMode === 'fast') {
          // Stream copy mode: ultra-fast but may have seeking issues
          ffmpegArgs.push('-c', 'copy', '-avoid_negative_ts', 'make_zero', '-movflags', '+faststart')
        } else {
          // Re-encode mode: slower but guarantees perfect seeking
          ffmpegArgs.push(
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '18',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero'
          )
        }
        ffmpegArgs.push(outputName)

        await ffmpeg.exec(ffmpegArgs)

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
              <label className="text-sm font-bold text-text-muted mb-3 block">Encoding Mode</label>
              <div className="flex bg-white/50 p-1 rounded-xl mb-6 shadow-sm border border-white/20">
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${encodingMode === 'compatible' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:bg-white/40'}`}
                  onClick={() => setEncodingMode('compatible')}
                  disabled={processing}
                >
                  <Shield size={16} /> Compatible
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${encodingMode === 'fast' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:bg-white/40'}`}
                  onClick={() => setEncodingMode('fast')}
                  disabled={processing}
                >
                  <Zap size={16} /> Fast
                </button>
              </div>
              {encodingMode === 'compatible' && (
                <div className="info-badge" style={{ background: 'rgba(34,197,94,0.08)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.2)', marginBottom: '1rem', fontSize: '0.75rem' }}>
                  <Shield size={14} style={{ marginRight: '0.25rem' }} /> Re-encodes for perfect seeking &amp; playback. Slightly slower.
                </div>
              )}
              {encodingMode === 'fast' && (
                <div className="info-badge" style={{ background: 'rgba(234,179,8,0.08)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)', marginBottom: '1rem', fontSize: '0.75rem' }}>
                  <Zap size={14} style={{ marginRight: '0.25rem' }} /> Stream copy: instant speed, but seeking may not work on some players.
                </div>
              )}

              <label className="text-sm font-bold text-text-muted mb-3 block">Select Split Options</label>

              <div className="flex bg-white/50 p-1 rounded-xl mb-6 shadow-sm border border-white/20">
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${splitMode === 'parts' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:bg-white/40'}`}
                  onClick={() => setSplitMode('parts')}
                  disabled={processing}
                >
                  <Hash size={16} /> Equal Parts
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${splitMode === 'size' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:bg-white/40'}`}
                  onClick={() => setSplitMode('size')}
                  disabled={processing}
                >
                  <HardDrive size={16} /> By Size
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${splitMode === 'time' ? 'bg-white shadow-md text-primary' : 'text-text-muted hover:bg-white/40'}`}
                  onClick={() => setSplitMode('time')}
                  disabled={processing}
                >
                  <Clock size={16} /> By Time
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {file && (
                  <>
                    <div className="info-badge total-info">
                      Total: <span className="font-black ml-1">{formatTime(fileDuration)}</span>
                      <span className="mx-1">/</span>
                      <span className="font-black">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    {splitMode === 'parts' && (
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
                    )}
                    {splitMode === 'size' && (
                      <div className="info-badge part-info">
                        Est. Parts:
                        <span className="font-black ml-1">
                          {Math.max(1, Math.ceil((file.size / (1024 * 1024)) / splitSize))}
                        </span>
                      </div>
                    )}
                    {splitMode === 'time' && (
                      <div className="info-badge part-info">
                        Est. Parts:
                        <span className="font-black ml-1">
                          {Math.max(1, Math.ceil(fileDuration / splitTime))}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="counter-section">
                {splitMode === 'parts' && (
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
                )}

                {splitMode === 'size' && (
                  <div className="counter-container">
                    <button
                      className="counter-btn"
                      onClick={() => setSplitSize(Math.max(1, splitSize - 5))}
                      disabled={processing || splitSize <= 1}
                    >
                      <Minus size={20} />
                    </button>
                    <div className="counter-value">
                      <span className="number">{splitSize}</span>
                      <span className="unit">MB</span>
                    </div>
                    <button
                      className="counter-btn"
                      onClick={() => setSplitSize(splitSize + 5)}
                      disabled={processing}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}

                {splitMode === 'time' && (
                  <div className="counter-container">
                    <button
                      className="counter-btn"
                      onClick={() => setSplitTime(Math.max(10, splitTime - 10))}
                      disabled={processing || splitTime <= 10}
                    >
                      <Minus size={20} />
                    </button>
                    <div className="counter-value">
                      <span className="number">{splitTime}</span>
                      <span className="unit">Secs</span>
                    </div>
                    <button
                      className="counter-btn"
                      onClick={() => setSplitTime(splitTime + 10)}
                      disabled={processing}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                )}
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

      {/* Guide and FAQ Section */}
      <div className="mt-12 max-w-2xl mx-auto space-y-8 text-left">
        <section className="bg-white/40 p-6 rounded-2xl border border-white/20 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-primary" /> How to Split Videos Without Losing Quality
          </h2>
          <p className="text-text-muted text-sm leading-relaxed mb-4">
            Most video editing tools re-encode your media when you cut or split them. This process not only takes a massive amount of time but also degrades the quality of the original file.
          </p>
          <p className="text-text-muted text-sm leading-relaxed">
            <strong>Media Splitter</strong> uses an advanced <em>Stream Copy</em> technique via WebAssembly FFmpeg. Instead of rendering the video again, it simply copies the exact original media streams into new containers. This means your video is split <strong>instantly</strong>, with absolutely <strong>zero quality loss</strong>.
          </p>
        </section>

        <section className="bg-white/40 p-6 rounded-2xl border border-white/20 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" /> Frequently Asked Questions (FAQ)
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-text-main text-sm">Is there a file size limit?</h3>
              <p className="text-text-muted text-sm mt-1">No. Unlike cloud-based tools that limit you to 50MB or 100MB, Media Splitter runs entirely in your browser. You can split files of any size, even those that are several gigabytes.</p>
            </div>
            <div>
              <h3 className="font-bold text-text-main text-sm">Are my files uploaded to a server?</h3>
              <p className="text-text-muted text-sm mt-1">No. Your privacy is 100% guaranteed. All files are processed locally on your device. We never upload, store, or see your files.</p>
            </div>
            <div>
              <h3 className="font-bold text-text-main text-sm">What formats are supported?</h3>
              <p className="text-text-muted text-sm mt-1">We support standard media formats including MP4, MKV, AVI, MOV for video, and MP3, WAV for audio.</p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-10 text-center text-sm text-text-muted pb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3 bg-white/50 py-2 px-4 rounded-full w-fit mx-auto border border-white/20 shadow-sm">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="font-semibold text-text-main">100% Secure & Private</span>
        </div>
        <p className="mb-2">
          All processing is done completely locally within your browser. <br className="hidden sm:block" />
          <strong className="text-text-main font-bold"><Lock size={12} className="inline mr-1" />No files are ever uploaded or sent to any external server.</strong>
        </p>
        <p className="text-xs opacity-70">
          Media Splitter is a powerful, free tool designed to help you split large video and audio files with zero quality loss using direct stream copying technique.
        </p>
      </footer>
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
