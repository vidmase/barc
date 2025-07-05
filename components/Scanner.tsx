"use client"

import { useEffect, useRef } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"

interface ScannerProps {
  onScanSuccess: (result: string) => void
  onScanError: (error: Error) => void
}

export default function Scanner({ onScanSuccess, onScanError }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    const startScanning = async () => {
      try {
        codeReader.current = new BrowserMultiFormatReader()

        const videoElement = videoRef.current
        if (!videoElement) return

        // Get video devices
        const videoInputDevices = await codeReader.current.listVideoInputDevices()

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found")
        }

        // Prefer back camera for mobile devices
        const backCamera =
          videoInputDevices.find(
            (device) => device.label.toLowerCase().includes("back") || device.label.toLowerCase().includes("rear"),
          ) || videoInputDevices[0]

        // Start decoding
        codeReader.current.decodeFromVideoDevice(backCamera.deviceId, videoElement, (result, error) => {
          if (result) {
            onScanSuccess(result.getText())
          }
          if (error && error.name !== "NotFoundException") {
            console.warn("Scan error:", error)
          }
        })
      } catch (error) {
        console.error("Scanner initialization error:", error)
        onScanError(error as Error)
      }
    }

    startScanning()

    // Cleanup
    return () => {
      if (codeReader.current) {
        codeReader.current.reset()
      }
    }
  }, [onScanSuccess, onScanError])

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
}
