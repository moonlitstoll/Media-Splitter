import { motion as Motion } from 'framer-motion'
import { CheckCircle2, Download } from 'lucide-react'

export default function ResultList({ files, onDownloadAll, onReset }) {
  if (files.length === 0) return null

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="result-panel"
    >
      <div className="result-heading">
        <CheckCircle2 size={24} />
        Split Complete!
      </div>

      <div className="result-list">
        {files.map((file) => (
          <div key={file.name} className="result-item">
            <span className="result-name">{file.name}</span>
            <a href={file.url} download={file.name} className="result-download">
              <Download size={14} />
              Download
            </a>
          </div>
        ))}
      </div>

      <button type="button" className="split-btn" onClick={onDownloadAll}>
        <Download size={20} />
        Download All
      </button>

      <button type="button" className="reset-btn" onClick={onReset}>
        Process another file
      </button>
    </Motion.div>
  )
}
