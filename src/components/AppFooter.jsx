import { Lock, ShieldCheck } from 'lucide-react'

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-badge">
        <ShieldCheck size={16} className="footer-badge-icon" />
        <span>100% Secure & Private</span>
      </div>
      <p className="footer-copy">
        All processing is done completely locally within your browser.
        <br className="footer-break" />
        <strong>
          <Lock size={12} />
          No files are ever uploaded or sent to any external server.
        </strong>
      </p>
      <p className="footer-note">
        Media Splitter is a free tool for splitting large video and audio files in your browser using FFmpeg WebAssembly.
      </p>
    </footer>
  )
}
