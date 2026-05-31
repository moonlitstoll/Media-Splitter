import { Loader2 } from 'lucide-react'

export default function LoadingScreen({ status }) {
  return (
    <div className="loading-screen">
      <Loader2 className="loading-spinner" size={40} />
      <p className="loading-text">{status || 'Preparing the system...'}</p>
    </div>
  )
}
