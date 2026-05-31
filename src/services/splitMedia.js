import { fetchFile } from '@ffmpeg/util'
import { buildOutputName, parseFileName } from '../utils/fileName'
import { buildFfmpegArgs } from '../utils/ffmpegArgs'
import { calculateSegments } from '../utils/splitPlan'

export async function splitMediaFile({
  ffmpeg,
  file,
  duration,
  splitMode,
  parts,
  splitSize,
  splitTime,
  encodingMode,
  onStatus,
  onProgress,
  setSplitContext,
}) {
  const { baseName, ext } = parseFileName(file.name)
  const segments = calculateSegments({
    splitMode,
    duration,
    fileSize: file.size,
    parts,
    splitSize,
    splitTime,
  })

  if (segments.length === 0) {
    throw new Error('Could not calculate split segments for this file')
  }

  onStatus?.('Reading media file...')
  await ffmpeg.writeFile('input', await fetchFile(file))

  const outputs = []
  const totalParts = segments.length

  for (let i = 0; i < totalParts; i++) {
    const { start, duration: segmentDuration } = segments[i]
    const outputName = buildOutputName(i + 1, baseName, ext)
    const overallPercent = Math.round((i / totalParts) * 100)

    setSplitContext?.({ index: i, total: totalParts })
    onStatus?.(`Splitting part ${i + 1} of ${totalParts}... (${overallPercent}%)`)

    const ffmpegArgs = buildFfmpegArgs({
      encodingMode,
      start,
      duration: segmentDuration,
      outputName,
    })

    await ffmpeg.exec(ffmpegArgs)

    const data = await ffmpeg.readFile(outputName)
    const blob = new Blob([data.buffer], { type: file.type || 'application/octet-stream' })
    outputs.push({
      name: outputName,
      url: URL.createObjectURL(blob),
    })

    onProgress?.(Math.round(((i + 1) / totalParts) * 100))
  }

  setSplitContext?.(null)
  return outputs
}
