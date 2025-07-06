"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, NotFoundException, Result, Exception } from "@zxing/library"

interface ScannerProps {
  onScanSuccess: (result: string) => void
  onScanError: (error: Error) => void
}

interface ScannerHandle {
  captureFrame: () => string | null
}

const Scanner = forwardRef<ScannerHandle, ScannerProps>(function Scanner({ onScanSuccess, onScanError }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let stop = false
    let isInitializing = false

    const cleanup = () => {
      stop = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      if (codeReader.current) {
        codeReader.current.reset()
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }

    const startScanning = async () => {
      if (isInitializing) return
      isInitializing = true

      try {
        // Clean up any existing stream first
        cleanup()

        // Set up ZXing hints for better sensitivity
        const hints = new Map()
        hints.set(DecodeHintType.TRY_HARDER, true)

        codeReader.current = new BrowserMultiFormatReader(hints)

        const videoElement = videoRef.current
        if (!videoElement || stop) return

        // Get video devices
        const videoInputDevices = await codeReader.current.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found")
        }

        // Request higher resolution for better scan quality and prefer front camera
        const constraints = {
          video: {
            facingMode: { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        // Get media stream manually to set constraints
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (stop) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        streamRef.current = stream
        videoElement.srcObject = stream

        // Wait for the video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
            videoElement.removeEventListener('error', onError)
            resolve()
          }
          const onError = (e: Event) => {
            videoElement.removeEventListener('loadedmetadata', onLoadedMetadata)
            videoElement.removeEventListener('error', onError)
            reject(new Error('Video loading failed'))
          }
          videoElement.addEventListener('loadedmetadata', onLoadedMetadata)
          videoElement.addEventListener('error', onError)
        })

        if (stop) return

        await videoElement.play()

        // Continuous scan loop using Promise style
        while (!stop) {
          try {
            const result = await codeReader.current.decodeFromVideoElement(videoElement)
            if (result && !stop) {
              onScanSuccess(result.getText())
              break // Stop after successful scan
            }
          } catch (error) {
            // NotFoundException means no barcode found in this frame, continue
            // Other errors can be logged and reported
            if (error && typeof error === 'object' && 'name' in error && (error as any).name !== "NotFoundException") {
              console.warn("Scan error:", error)
              if (!stop) {
                onScanError(error as Error)
              }
              break // Stop the loop on a persistent error
            }
            // Retry after a short delay for better sensitivity
            await new Promise(res => setTimeout(res, 100))
          }
        }
      } catch (error) {
        console.error("Scanner initialization error:", error)
        if (!stop) {
          onScanError(error as Error)
        }
      } finally {
        isInitializing = false
      }
    }

    startScanning()

    // Cleanup function
    return cleanup
  }, [onScanSuccess, onScanError])

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current
      if (!video) return null
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL("image/jpeg").split(",")[1] // base64 without prefix
    }
  }))

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-blue-400 rounded-lg relative">
            {/* Corner indicators */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div
                className="absolute w-full h-0.5 bg-blue-400 animate-pulse"
                style={{
                  animation: "scan 2s linear infinite",
                  top: "50%",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  )
})

export default Scanner
