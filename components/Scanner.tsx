"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, NotFoundException } from "@zxing/library"

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
  const scanningRef = useRef(false)

  useEffect(() => {
    const startScanning = async () => {
      try {
        console.log("🔍 Starting barcode scanner...")

        // Initialize ZXing reader
        codeReader.current = new BrowserMultiFormatReader()
        
        const videoElement = videoRef.current
        if (!videoElement) {
          throw new Error("Video element not found")
        }

        console.log("📹 Video element found, requesting camera...")

        // Get available video devices
        const videoDevices = await codeReader.current.listVideoInputDevices()
        console.log("📱 Available video devices:", videoDevices.length)

        if (videoDevices.length === 0) {
          throw new Error("No video input devices found")
        }

        // Use the first available device (usually back camera on mobile)
        const selectedDeviceId = videoDevices[0].deviceId
        console.log("🎯 Using device:", selectedDeviceId)

        // Start continuous decoding
        scanningRef.current = true
        console.log("▶️ Starting continuous decode...")

        const controls = await codeReader.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoElement,
          (result: any, error: any) => {
            if (result) {
              console.log("✅ BARCODE FOUND:", result.getText())
              scanningRef.current = false
              onScanSuccess(result.getText())
              // Stop scanning after successful detection - access controls from stored reference
              const storedControls = (codeReader.current as any)?._controls
              if (storedControls && storedControls.stop) {
                storedControls.stop()
              }
            } else if (error && !(error instanceof NotFoundException)) {
              console.warn("⚠️ Decode error:", error.message)
              // Don't stop scanning for normal errors
            }
          }
        )

        console.log("🎮 Scan controls created, scanner is running")

        // Store controls for cleanup
        ;(codeReader.current as any)._controls = controls

      } catch (error) {
        console.error("❌ Scanner initialization failed:", error)
        onScanError(error as Error)
      }
    }

    startScanning()

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up scanner...")
      scanningRef.current = false
      
      if (codeReader.current) {
        try {
          const controls = (codeReader.current as any)._controls
          if (controls) {
            controls.stop()
          }
          codeReader.current.reset()
        } catch (e) {
          console.warn("Cleanup error:", e)
        }
        codeReader.current = null
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
      
      if (!ctx) return null
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
    }
  }))

  return (
    <div className="relative w-full h-full">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover" 
        autoPlay 
        muted 
        playsInline
        onLoadedData={() => console.log("📺 Video loaded and ready")}
        onPlay={() => console.log("▶️ Video started playing")}
        onError={(e) => console.error("📺 Video error:", e)}
      />

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
              <div className="absolute w-full h-0.5 bg-blue-400 animate-pulse scan-line"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug info overlay */}
      <div className="absolute top-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-xs">
          Scanner active - Check browser console for debug info
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          Point any barcode at the center frame
        </div>
      </div>
    </div>
  )
})

export default Scanner
