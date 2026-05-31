import { Upload } from 'lucide-react'
import { formatMegabytesPrecise } from '../utils/formatTime'

export default function FileUpload({
  file,
  isDragging,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  onOpenPicker,
}) {
  return (
    <div
      className={`upload-zone ${isDragging ? 'dragging' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={onFileChange}
        accept="video/*,audio/*"
      />
      <Upload className="upload-icon" strokeWidth={2.5} />

      <div className="upload-copy">
        <p className="upload-title">
          {file ? file.name : 'Drag and drop or select media'}
        </p>
        <p className="upload-subtitle">
          {file
            ? `${formatMegabytesPrecise(file.size)} MB`
            : 'Supports MP4, MKV, MP3 (No max size limit)'}
        </p>
      </div>

      <button type="button" className="upload-btn" onClick={onOpenPicker}>
        Select File
      </button>
    </div>
  )
}
