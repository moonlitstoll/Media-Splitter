# Media Splitter

Browser-based video and audio splitter powered by FFmpeg WebAssembly. Files are processed locally in the browser — nothing is uploaded to a server.

## Features

- Split by equal parts, target file size (MB), or fixed time intervals
- Encoding modes: **Compatible** (re-encode) or **Fast** (stream copy)
- Drag-and-drop or file picker
- Download individual segments or all at once

## Requirements

- Modern browser with `SharedArrayBuffer` support
- Dev server and production host must send COOP/COEP headers (configured in `vite.config.js` and `public/_headers`)

## Scripts

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
npm run probe -- path/to/video.mp4  # local ffprobe debug helper
```

## Project Structure

```
src/
  components/   # UI components
  hooks/        # React hooks (FFmpeg, media file)
  services/     # Split orchestration
  utils/        # Pure helpers (split plan, ffmpeg args, formatting)
  App.jsx         # App shell
```
