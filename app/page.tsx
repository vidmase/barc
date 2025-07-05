"use client"

import { useState, useEffect, useRef } from "react"
import { supabase, type Scan } from "@/lib/supabase"
import Scanner from "@/components/Scanner"
import StatusMessage from "@/components/StatusMessage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, Smartphone, Barcode, Trash2 } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ProductDetails } from "@/components/ProductDetails"

interface Product {
  name: string;
  description: string;
  imageUrl: string;
  barcode: string;
}

export default function ScanPage() {
  const [scannedValue, setScannedValue] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("Point your camera at a barcode to scan")
  const [isScanning, setIsScanning] = useState(false)
  const [scanHistory, setScanHistory] = useState<Scan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const scannerRef = useRef<any>(null)
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true)
      setHistoryError(null)
      try {
        const { data, error } = await supabase.from("scans").select("*", { count: "exact" }).order("scanned_at", { ascending: false })
        if (error) throw error
        setScanHistory(data || [])
      } catch (err: any) {
        setHistoryError(err.message)
      } finally {
        setLoadingHistory(false)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    if (scannedValue) {
      // In a real app, you would fetch product details from your database
      // based on the scannedData (barcode)
      setProduct({
        name: "Example Product",
        description: "This is a fantastic product that you will love.",
        imageUrl: "/placeholder.jpg",
        barcode: scannedValue,
      })
    } else {
      setProduct(null);
    }
  }, [scannedValue])

  // Handle successful barcode scan
  const handleScanSuccess = async (result: string) => {
    if (result && result !== scannedValue) {
      console.log("Scanned:", result)
      setScannedValue(result)
      setStatusMessage(`Barcode detected: ${result}`)
      setSaveError(null)
      setIsScanning(false)

      // --- Gemini integration ---
      if (scannerRef.current && scannerRef.current.captureFrame) {
        const image_base64 = scannerRef.current.captureFrame()
        if (image_base64) {
          setStatusMessage("Extracting address from image...")
          try {
            const res = await fetch("/api/scan-with-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ barcode_value: result, image_base64 }),
            })
            const data = await res.json()
            if (data.success) {
              setStatusMessage("✅ Saved with address: " + (data.data[0]?.extracted_address || "(none)"))
              // Optionally, refresh scan history here
            } else {
              setStatusMessage("❌ Error: " + (data.error || "Unknown error"))
            }
          } catch (err: any) {
            setStatusMessage("❌ Error: " + err.message)
          }
        }
      }
      // --- End Gemini integration ---
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
          address: address.trim() || null,
        },
      ])

      if (error) {
        throw error
      }

      // Success
      setScannedValue("")
      setAddress("")
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

  // Delete a scan by id
  const handleDelete = async (id: string) => {
    try {
      await supabase.from("scans").delete().eq("id", id)
      setScanHistory((prev) => prev.filter((scan) => scan.id !== id))
    } catch (err: any) {
      setStatusMessage("❌ Error deleting: " + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="p-2 bg-blue-600 rounded-full">
                <Barcode className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Barcode Scanner</CardTitle>
            </div>
            <p className="text-gray-600 text-sm">Scan box barcodes and store them securely</p>
          </CardHeader>
        </Card>

        {/* Address Input */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Delivery Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Enter delivery address..."
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Scanner Area */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-square relative bg-gray-900 flex items-center justify-center">
              {isScanning ? (
                <Scanner ref={scannerRef} onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
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
        <ProductDetails product={product} />

        {/* Action Buttons */}
        <div className="space-y-3">
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

        {/* Scan History Table */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-gray-500">Loading...</div>
            ) : historyError ? (
              <div className="text-red-600">{historyError}</div>
            ) : scanHistory.length === 0 ? (
              <div className="text-gray-500">No scans yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Scanned At</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanHistory.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>{scan.address || "-"}</TableCell>
                      <TableCell>{scan.barcode_value}</TableCell>
                      <TableCell>{new Date(scan.scanned_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleDelete(scan.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete scan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
