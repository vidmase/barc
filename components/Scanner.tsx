"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
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
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [currentCameraId, setCurrentCameraId] = useState<string>("")

  const findRearCamera = (devices: MediaDeviceInfo[]): MediaDeviceInfo | null => {
    // Look for rear camera indicators
    const rearKeywords = ['back', 'rear', 'environment', 'facing back', 'camera2']
    
    for (const device of devices) {
      const label = device.label.toLowerCase()
      if (rearKeywords.some(keyword => label.includes(keyword))) {
        console.log("🎯 Found rear camera:", device.label)
        return device
      }
    }
    
    // If no rear camera found by label, try to use environment constraint
    // This will typically select the rear camera on mobile devices
    return null
  }

  const startScanning = async (deviceId?: string) => {
    try {
      console.log("🔍 Starting barcode scanner...")

      // Stop any existing scanning
      if (codeReader.current) {
        try {
          const controls = (codeReader.current as any)._controls
          if (controls && controls.stop) {
            controls.stop()
          }
          codeReader.current.reset()
        } catch (e) {
          console.warn("Previous cleanup error:", e)
        }
      }

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
      
      // Log all available cameras
      videoDevices.forEach((device, index) => {
        console.log(`📷 Camera ${index}: ${device.label} (${device.deviceId})`)
      })

      setAvailableCameras(videoDevices)

      if (videoDevices.length === 0) {
        throw new Error("No video input devices found")
      }

      let selectedDeviceId = deviceId

      if (!selectedDeviceId) {
        // Try to find rear camera first
        const rearCamera = findRearCamera(videoDevices)
        if (rearCamera) {
          selectedDeviceId = rearCamera.deviceId
          console.log("🎯 Using rear camera:", rearCamera.label)
        } else {
          // Fallback to first available camera
          selectedDeviceId = videoDevices[0].deviceId
          console.log("🎯 Using fallback camera:", videoDevices[0].label)
        }
      }

      setCurrentCameraId(selectedDeviceId)
      console.log("🎯 Selected device ID:", selectedDeviceId)

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
            // Stop scanning after successful detection
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

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      console.log("📷 Only one camera available, cannot switch")
      return
    }

    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === currentCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]
    
    console.log("🔄 Switching to camera:", nextCamera.label)
    await startScanning(nextCamera.deviceId)
  }

  useEffect(() => {
    startScanning()

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up scanner...")
      scanningRef.current = false
      
      if (codeReader.current) {
        try {
          const controls = (codeReader.current as any)._controls
          if (controls && controls.stop) {
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

      {/* Camera switch button */}
      {availableCameras.length > 1 && (
        <div className="absolute top-4 right-4">
          <button
            onClick={switchCamera}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
            title="Switch Camera"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

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
      <div className="absolute top-4 left-4 text-left">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-xs">
          <div>📱 Cameras: {availableCameras.length}</div>
          <div>🎯 Current: {availableCameras.find(c => c.deviceId === currentCameraId)?.label?.slice(0, 20) || "Unknown"}</div>
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          Point any barcode at the center frame
          {availableCameras.length > 1 && " • Tap ↻ to switch cameras"}
        </div>
      </div>
    </div>
  )
})

export default Scanner
