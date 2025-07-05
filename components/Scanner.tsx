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

  useEffect(() => {
    let stop = false
    const startScanning = async () => {
      try {
        // Set up ZXing hints for better sensitivity
        const hints = new Map()
        hints.set(DecodeHintType.TRY_HARDER, true)
        // Optionally, specify formats if you know them:
        // hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, ...])

        codeReader.current = new BrowserMultiFormatReader(hints)

        const videoElement = videoRef.current
        if (!videoElement) return

        // Get video devices
        const videoInputDevices = await codeReader.current.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found")
        }

        // Request higher resolution for better scan quality and prefer rear camera
        const constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }

        // Get media stream manually to set constraints
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        videoElement.srcObject = stream
        await videoElement.play()

        // Continuous scan loop using Promise style
        while (!stop) {
          try {
            const result = await codeReader.current.decodeFromVideoElement(videoElement)
            if (result) {
              onScanSuccess(result.getText())
              break // Stop after successful scan
            }
          } catch (error) {
            // NotFoundException means no barcode found in this frame, continue
            // Other errors can be logged and reported
            if (error && typeof error === 'object' && 'name'in error && (error as any).name !== "NotFoundException") {
              console.warn("Scan error:", error)
              onScanError(error as Error);
              break; // Stop the loop on a persistent error
            }
            // Retry after a short delay for better sensitivity
            await new Promise(res => setTimeout(res, 100))
          }
        }
      } catch (error) {
        console.error("Scanner initialization error:", error)
        onScanError(error as Error)
      }
    }
    startScanning()
    // Cleanup
    return () => {
      stop = true
      if (codeReader.current) {
        codeReader.current.reset()
      }
    }
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
