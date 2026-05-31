import { motion as Motion } from 'framer-motion'

export default function ProgressDisplay({ status, progress }) {
  return (
    <div className="progress-container">
      <p className="status-text">{status}</p>
      <div className="progress-bar">
        <Motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
