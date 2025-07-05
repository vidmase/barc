"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Copy } from "lucide-react"
import { useState } from "react"

interface ScannedDisplayProps {
  value: string
}

export default function ScannedDisplay({ value }: ScannedDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  if (!value) return null

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium text-gray-700">Detected Barcode:</span>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-200">
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono font-bold text-gray-800 break-all">{value}</code>
            <button
              onClick={copyToClipboard}
              className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        {copied && <p className="text-sm text-green-600 mt-2 text-center">✓ Copied to clipboard!</p>}
      </CardContent>
    </Card>
  )
}
