export function revokeBlobUrls(urls) {
  urls.forEach((url) => URL.revokeObjectURL(url))
}

export function downloadBlob(url, name) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function downloadAllResults(files) {
  files.forEach((file) => downloadBlob(file.url, file.name))
}
