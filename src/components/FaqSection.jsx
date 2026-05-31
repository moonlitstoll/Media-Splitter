import { CheckCircle2, ShieldCheck } from 'lucide-react'

export default function FaqSection() {
  return (
    <div className="faq-wrapper">
      <section className="faq-card">
        <h2 className="faq-title">
          <CheckCircle2 size={20} />
          How to Split Videos Without Losing Quality
        </h2>
        <p className="faq-text">
          Most video editing tools re-encode your media when you cut or split them. This process not only takes a massive amount of time but also degrades the quality of the original file.
        </p>
        <p className="faq-text">
          <strong>Media Splitter</strong> runs FFmpeg in your browser. Choose <strong>Fast</strong> mode for instant stream copy with zero quality loss, or <strong>Compatible</strong> mode to re-encode for better playback on more devices.
        </p>
      </section>

      <section className="faq-card">
        <h2 className="faq-title">
          <ShieldCheck size={20} />
          Frequently Asked Questions (FAQ)
        </h2>
        <div className="faq-list">
          <div>
            <h3 className="faq-question">Is there a file size limit?</h3>
            <p className="faq-answer">
              No. Unlike cloud-based tools that limit you to 50MB or 100MB, Media Splitter runs entirely in your browser. You can split files of any size, even those that are several gigabytes.
            </p>
          </div>
          <div>
            <h3 className="faq-question">Are my files uploaded to a server?</h3>
            <p className="faq-answer">
              No. Your privacy is 100% guaranteed. All files are processed locally on your device. We never upload, store, or see your files.
            </p>
          </div>
          <div>
            <h3 className="faq-question">What formats are supported?</h3>
            <p className="faq-answer">
              We support standard media formats including MP4, MKV, AVI, MOV for video, and MP3, WAV for audio.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
