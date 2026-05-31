import ffprobe from 'ffprobe-static'
import { execSync } from 'child_process'

const file = process.argv[2]

if (!file) {
  console.error('Usage: node debug-probe.js <media-file-path>')
  process.exit(1)
}

const command = `"${ffprobe.path}" -v error -show_streams -print_format json "${file}"`

try {
  const result = execSync(command).toString()
  console.log(result)
} catch (err) {
  console.error('Error executing ffprobe:', err.message)
  if (err.stderr) console.error('stderr:', err.stderr.toString())
  process.exit(1)
}
