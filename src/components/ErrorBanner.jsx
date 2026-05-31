import { AlertCircle } from 'lucide-react'

export default function ErrorBanner({ message, title = 'System Load Error' }) {
  if (!message) return null

  return (
    <div className="error-banner">
      <AlertCircle size={20} className="error-banner-icon" />
      <div>
        <p className="error-banner-title">{title}</p>
        <p className="error-banner-message">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="error-banner-retry"
        >
          Try reloading the page
        </button>
      </div>
    </div>
  )
}
