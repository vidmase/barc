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
  const scanningRef = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const startScanning = async () => {
      try {
        // Check for camera permissions first
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (permissionStatus.state === 'denied') {
          throw new Error("Camera permission denied")
        }

        // Set up ZXing hints for better barcode detection
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
          BarcodeFormat.DATA_MATRIX,
          BarcodeFormat.PDF_417,
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF,
          BarcodeFormat.RSS_14,
          BarcodeFormat.RSS_EXPANDED
        ])

        codeReader.current = new BrowserMultiFormatReader(hints)

        const videoElement = videoRef.current
        if (!videoElement) return

        // Try multiple camera constraints for better compatibility
        const constraints = [
          // Try rear camera first with high resolution
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 },
              frameRate: { ideal: 30, min: 15 }
            }
          },
          // Fallback to any camera with medium resolution
          {
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
              frameRate: { ideal: 30, min: 15 }
            }
          },
          // Final fallback - basic constraints
          {
            video: {
              width: { min: 640 },
              height: { min: 480 }
            }
          }
        ]

        let stream: MediaStream | null = null
        
        // Try each constraint set until one works
        for (const constraint of constraints) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraint)
            break
          } catch (e) {
            console.warn("Camera constraint failed, trying next:", e)
            continue
          }
        }

        if (!stream) {
          throw new Error("Could not access camera with any configuration")
        }

        streamRef.current = stream
        videoElement.srcObject = stream

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Video load timeout")), 10000)
          
          videoElement.onloadedmetadata = () => {
            clearTimeout(timeout)
            resolve(undefined)
          }
          
          videoElement.onerror = () => {
            clearTimeout(timeout)
            reject(new Error("Video load error"))
          }
        })

        await videoElement.play()
        scanningRef.current = true

        // Continuous scanning loop with improved error handling
        const scanLoop = async () => {
          while (scanningRef.current) {
            try {
              const result = await codeReader.current!.decodeFromVideoElement(videoElement)
              if (result && result.getText()) {
                console.log("Barcode detected:", result.getText())
                onScanSuccess(result.getText())
                return // Stop scanning after successful detection
              }
            } catch (error) {
              // Only log non-NotFoundException errors
              if (error instanceof Error && error.name !== "NotFoundException") {
                console.warn("Scan error:", error.message)
                // Continue scanning for most errors, but break on critical ones
                if (error.name === "NotAllowedError" || error.name === "NotFoundError") {
                  onScanError(error)
                  return
                }
              }
            }
            
            // Small delay to prevent excessive CPU usage
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }

        scanLoop()

      } catch (error) {
        console.error("Scanner initialization error:", error)
        onScanError(error as Error)
      }
    }

    startScanning()

    // Cleanup function
    return () => {
      scanningRef.current = false
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        streamRef.current = null
      }
      
      if (codeReader.current) {
        codeReader.current.reset()
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
      return canvas.toDataURL("image/jpeg", 0.8).split(",")[1] // base64 without prefix
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
              <div className="absolute w-full h-0.5 bg-blue-400 animate-pulse scan-line"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-4 right-4 text-center">
        <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
          Hold steady and ensure barcode is well-lit and in focus
        </div>
      </div>
    </div>
  )
})

export default Scanner
