import { useCallback, useEffect, useRef, useState } from 'react'
import { getMediaDuration } from '../utils/getDuration'
import { revokeBlobUrls } from '../utils/blobUrls'

export function useMediaFile() {
  const fileInputRef = useRef(null)
  const resultUrlsRef = useRef([])
  const [file, setFile] = useState(null)
  const [fileDuration, setFileDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const revokeResultUrls = useCallback(() => {
    revokeBlobUrls(resultUrlsRef.current)
    resultUrlsRef.current = []
  }, [])

  const trackResultUrls = useCallback((results) => {
    revokeResultUrls()
    resultUrlsRef.current = results.map((item) => item.url)
  }, [revokeResultUrls])

  const selectFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return

    setFile(selectedFile)
    revokeResultUrls()
    setError('')

    try {
      const duration = await getMediaDuration(selectedFile)
      setFileDuration(duration)
    } catch (err) {
      console.error(err)
      setFile(null)
      setFileDuration(0)
      setError('Could not read this media file. Please try a different format.')
    }
  }, [revokeResultUrls])

  const handleDragOver = useCallback((event) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (event) => {
    event.preventDefault()
    setIsDragging(false)
    await selectFile(event.dataTransfer.files[0])
  }, [selectFile])

  const handleFileChange = useCallback(async (event) => {
    await selectFile(event.target.files[0])
    event.target.value = ''
  }, [selectFile])

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const resetMedia = useCallback(() => {
    revokeResultUrls()
    setFile(null)
    setFileDuration(0)
    setError('')
  }, [revokeResultUrls])

  useEffect(() => () => revokeResultUrls(), [revokeResultUrls])

  return {
    file,
    fileDuration,
    isDragging,
    error,
    setError,
    fileInputRef,
    selectFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    openFilePicker,
    resetMedia,
    trackResultUrls,
    revokeResultUrls,
  }
}
