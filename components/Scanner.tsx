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
  const controlsRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    const startScanning = async () => {
      try {
        // Set up ZXing hints for better sensitivity
        const hints = new Map()
        hints.set(DecodeHintType.TRY_HARDER, true)
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX
        ])

        codeReader.current = new BrowserMultiFormatReader(hints)

        const videoElement = videoRef.current
        if (!videoElement) return

        // Get video devices
        const videoInputDevices = await codeReader.current.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found")
        }

        // Select the best camera (preferably back camera)
        let selectedDeviceId = videoInputDevices[0].deviceId
        
        // Try to find a back-facing camera
        const backCamera = videoInputDevices.find((device: MediaDeviceInfo) => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        
        if (backCamera) {
          selectedDeviceId = backCamera.deviceId
        }

        // Use the proper continuous scanning method
        const controls = await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoElement,
          (result: Result | undefined, error: Exception | undefined) => {
            if (result) {
              // Successfully decoded
              const text = result.getText()
              console.log("Scanned:", text)
              onScanSuccess(text)
              // Note: Don't stop here if you want continuous scanning
              // If you want to stop after first scan, uncomment the next line:
              // controls.stop()
            }
            
            if (error) {
              // Only log non-NotFoundException errors
              if (!(error instanceof NotFoundException)) {
                console.warn("Scan error:", error)
                onScanError(error)
              }
              // NotFoundException is normal - it just means no barcode was found in this frame
            }
          }
        )

        controlsRef.current = controls

      } catch (error) {
        console.error("Scanner initialization error:", error)
        onScanError(error as Error)
      }
    }

    startScanning()

    // Cleanup function
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
      }
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
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL("image/jpeg").split(",")[1] // base64 without prefix
      }
      return null
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
