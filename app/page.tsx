"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Scanner from "@/components/Scanner"
import ScannedDisplay from "@/components/ScannedDisplay"
import SaveButton from "@/components/SaveButton"
import StatusMessage from "@/components/StatusMessage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scan, Database, Smartphone } from "lucide-react"

export default function ScanPage() {
  const [scannedValue, setScannedValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("Point your camera at a barcode to scan")
  const [isScanning, setIsScanning] = useState(false)

  // Handle successful barcode scan
  const handleScanSuccess = (result: string) => {
    if (result && result !== scannedValue) {
      console.log("Scanned:", result)
      setScannedValue(result)
      setStatusMessage(`Barcode detected: ${result}`)
      setSaveError(null)
      setIsScanning(false)
    }
  }

  // Handle scan errors
  const handleScanError = (error: Error) => {
    console.error("Scan Error:", error)
    if (error.name === "NotAllowedError") {
      setStatusMessage("Camera access denied. Please allow camera permissions.")
    } else if (error.name === "NotFoundError") {
      setStatusMessage("No camera found on this device.")
    } else {
      setStatusMessage(`Camera error: ${error.message}`)
    }
  }

  // Save scanned barcode to Supabase
  const handleSave = async () => {
    if (!scannedValue || isSaving) {
      return
    }

    setIsSaving(true)
    setSaveError(null)
    setStatusMessage("Saving to database...")

    try {
      const { data, error } = await supabase.from("scans").insert([
        {
          barcode_value: scannedValue,
          scanned_at: new Date().toISOString(),
        },
      ])

      if (error) {
        throw error
      }

      // Success
      setScannedValue("")
      setStatusMessage("✅ Saved successfully!")
      console.log("Saved data:", data)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setStatusMessage("Ready to scan next barcode")
      }, 3000)
    } catch (error: any) {
      console.error("Error saving barcode:", error)
      setSaveError(error.message)
      setStatusMessage(`❌ Error saving: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Start scanning
  const startScanning = () => {
    setIsScanning(true)
    setStatusMessage("Scanning... Point camera at barcode")
    setSaveError(null)
  }

  // Stop scanning
  const stopScanning = () => {
    setIsScanning(false)
    setStatusMessage("Scanning stopped")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-blue-600 rounded-full">
                <Scan className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Barcode Scanner</CardTitle>
            </div>
            <p className="text-gray-600 text-sm">Scan box barcodes and store them securely</p>
          </CardHeader>
        </Card>

        {/* Scanner Area */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square relative bg-gray-900 flex items-center justify-center">
              {isScanning ? (
                <Scanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
              ) : (
                <div className="text-center text-white p-8">
                  <Smartphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-4">Camera Ready</p>
                  <button
                    onClick={startScanning}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    Start Scanning
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Message */}
        <StatusMessage message={statusMessage} error={saveError} />

        {/* Scanned Value Display */}
        {scannedValue && <ScannedDisplay value={scannedValue} />}

        {/* Action Buttons */}
        <div className="space-y-3">
          {scannedValue && (
            <SaveButton onClick={handleSave} disabled={isSaving || !scannedValue} isLoading={isSaving} />
          )}

          {isScanning && (
            <button
              onClick={stopScanning}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Stop Scanning
            </button>
          )}
        </div>

        {/* Info Card */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Database className="h-5 w-5 text-blue-600" />
              <span>Data is securely stored in Supabase</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
