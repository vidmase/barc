"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"

interface ScannerProps {
  onScanSuccess: (result: string) => void
  onScanError: (error: Error) => void
}

interface ScannerHandle {
  captureFrame: () => string | null
}

const Scanner = forwardRef<ScannerHandle, ScannerProps>(function Scanner({ onScanSuccess, onScanError }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const isScanning = useRef(false)

  useEffect(() => {
    let cleanup: (() => void) | null = null

    const startScanner = async () => {
      try {
        console.log("🔍 Initializing barcode scanner...")
        
        const codeReader = new BrowserMultiFormatReader()
        readerRef.current = codeReader
        
        console.log("📱 Getting camera devices...")
        const videoInputDevices = await codeReader.listVideoInputDevices()
        
        console.log(`📷 Found ${videoInputDevices.length} camera(s):`)
        videoInputDevices.forEach((device: MediaDeviceInfo, index: number) => {
          console.log(`  ${index}: ${device.label || 'Unknown Camera'} (${device.deviceId})`)
        })

        if (videoInputDevices.length === 0) {
          throw new Error('No camera devices found')
        }

        // Prefer rear camera (environment) over front camera (user)
        let selectedDeviceId = videoInputDevices[0].deviceId
        
        // Look for rear camera
        const rearCamera = videoInputDevices.find((device: MediaDeviceInfo) => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        )
        
        if (rearCamera) {
          selectedDeviceId = rearCamera.deviceId
          console.log("🎯 Using rear camera:", rearCamera.label)
        } else {
          console.log("🎯 Using default camera:", videoInputDevices[0].label || 'Unknown')
        }

        isScanning.current = true
        console.log("▶️ Starting continuous scanning...")

        // Use the proven decodeFromVideoDevice method
        await codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              console.log("🎉 BARCODE DETECTED:", result.getText())
              onScanSuccess(result.getText())
            }
            
            if (err) {
              // Only log non-NotFoundException errors
              if (err.name !== 'NotFoundException') {
                console.warn("⚠️ Scanning error:", err.message)
              }
            }
          }
        )

        console.log("✅ Scanner started successfully!")

        // Set up cleanup function
        cleanup = () => {
          console.log("🧹 Stopping scanner...")
          isScanning.current = false
          codeReader.reset()
        }

      } catch (error) {
        console.error("❌ Scanner failed to start:", error)
        onScanError(error as Error)
      }
    }

    startScanner()

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [onScanSuccess, onScanError])

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const video = videoRef.current
      if (!video) return null
      
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      
      if (!ctx) return null
      
      ctx.drawImage(video, 0, 0)
      return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    }
  }))

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        style={{ transform: 'scaleX(-1)' }} // Mirror video for better UX
      />
      
      {/* Simple scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Scanning viewfinder */}
        <div className="relative">
          <div className="w-64 h-64 border-4 border-white border-opacity-50 bg-transparent">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-red-500"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-red-500"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-red-500"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-red-500"></div>
            
            {/* Scanning line */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 opacity-70 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Position barcode within the frame</p>
          <p className="text-xs opacity-75 mt-1">Scanner is active - check console for debug info</p>
        </div>
      </div>

      {/* Debug info */}
      <div className="absolute top-4 left-4 text-white text-xs">
        <div className="bg-black bg-opacity-75 px-3 py-2 rounded">
          <div>🔍 Scanner: {isScanning.current ? 'Active' : 'Inactive'}</div>
          <div>📱 Check browser console for details</div>
        </div>
      </div>
    </div>
  )
})

export default Scanner
