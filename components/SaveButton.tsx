"use client"

import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"

interface SaveButtonProps {
  onClick: () => void
  disabled: boolean
  isLoading: boolean
}

export default function SaveButton({ onClick, disabled, isLoading }: SaveButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-5 w-5" />
          Save Barcode
        </>
      )}
    </Button>
  )
}
