export function buildFfmpegArgs({ encodingMode, start, duration, outputName }) {
  const args = ['-ss', start.toString(), '-i', 'input', '-t', duration.toString()]

  if (encodingMode === 'fast') {
    args.push('-c', 'copy', '-avoid_negative_ts', 'make_zero', '-movflags', '+faststart')
  } else {
    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      '-avoid_negative_ts', 'make_zero',
    )
  }

  args.push(outputName)
  return args
}
