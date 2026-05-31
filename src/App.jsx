import { useState } from 'react'
import { motion as Motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import { useFFmpeg } from './hooks/useFFmpeg'
import { useMediaFile } from './hooks/useMediaFile'
import { splitMediaFile } from './services/splitMedia'
import FileUpload from './components/FileUpload'
import SplitOptions from './components/SplitOptions'
import ProgressDisplay from './components/ProgressDisplay'
import ResultList from './components/ResultList'
import { downloadAllResults } from './utils/blobUrls'
import ErrorBanner from './components/ErrorBanner'
import LoadingScreen from './components/LoadingScreen'
import FaqSection from './components/FaqSection'
import AppFooter from './components/AppFooter'
import './index.css'

function App() {
  const {
    ffmpegRef,
    loaded,
    loadStatus,
    error: ffmpegError,
    progress,
    setProgress,
    setSplitContext,
  } = useFFmpeg()

  const {
    file,
    fileDuration,
    isDragging,
    error: mediaError,
    setError: setMediaError,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    openFilePicker,
    resetMedia,
    trackResultUrls,
    revokeResultUrls,
  } = useMediaFile()

  const [splitMode, setSplitMode] = useState('parts')
  const [parts, setParts] = useState(2)
  const [splitSize, setSplitSize] = useState(10)
  const [splitTime, setSplitTime] = useState(60)
  const [encodingMode, setEncodingMode] = useState('compatible')
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [resultFiles, setResultFiles] = useState([])

  const error = ffmpegError || mediaError

  const handleSplit = async () => {
    if (!file || !fileDuration) return

    setProcessing(true)
    setMediaError('')
    revokeResultUrls()
    setResultFiles([])
    setProgress(0)

    try {
      const outputs = await splitMediaFile({
        ffmpeg: ffmpegRef.current,
        file,
        duration: fileDuration,
        splitMode,
        parts,
        splitSize,
        splitTime,
        encodingMode,
        onStatus: setStatus,
        onProgress: setProgress,
        setSplitContext,
      })

      trackResultUrls(outputs)
      setResultFiles(outputs)
      setStatus('Done!')
      setProgress(100)
    } catch (err) {
      console.error(err)
      setMediaError('An error occurred. Please check if the file format is valid.')
      setSplitContext(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleReset = () => {
    revokeResultUrls()
    setResultFiles([])
    resetMedia()
    setProgress(0)
    setStatus('')
  }

  return (
    <div className="container">
      <Motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
      >
        <h1 className="title">Media Splitter</h1>
        <p className="subtitle">
          Maintain original quality, split precisely as many times as you want.
        </p>

        {!loaded && !error ? <LoadingScreen status={loadStatus} /> : null}
        <ErrorBanner message={error} />

        {loaded ? (
          <>
            <FileUpload
              file={file}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onOpenPicker={openFilePicker}
            />

            <SplitOptions
              file={file}
              fileDuration={fileDuration}
              encodingMode={encodingMode}
              onEncodingModeChange={setEncodingMode}
              splitMode={splitMode}
              onSplitModeChange={setSplitMode}
              parts={parts}
              onPartsChange={setParts}
              splitSize={splitSize}
              onSplitSizeChange={setSplitSize}
              splitTime={splitTime}
              onSplitTimeChange={setSplitTime}
              disabled={processing}
            />

            {processing ? <ProgressDisplay status={status} progress={progress} /> : null}

            {!processing && resultFiles.length === 0 ? (
              <button
                type="button"
                className="split-btn split-btn-spaced"
                disabled={!file || !fileDuration}
                onClick={handleSplit}
              >
                <Scissors size={20} strokeWidth={2.5} />
                Start Splitting
              </button>
            ) : null}

            {!processing ? (
              <ResultList
                files={resultFiles}
                onDownloadAll={() => downloadAllResults(resultFiles)}
                onReset={handleReset}
              />
            ) : null}
          </>
        ) : null}
      </Motion.div>

      <FaqSection />
      <AppFooter />
    </div>
  )
}

export default App
