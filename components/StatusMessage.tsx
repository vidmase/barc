import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Info, CheckCircle } from "lucide-react"

interface StatusMessageProps {
  message: string
  error?: string | null
}

export default function StatusMessage({ message, error }: StatusMessageProps) {
  if (!message && !error) return null

  const displayMessage = error || message
  const isError = !!error
  const isSuccess = message.includes("✅") || message.includes("successfully")

  const getIcon = () => {
    if (isError) return <AlertCircle className="h-5 w-5 text-red-600" />
    if (isSuccess) return <CheckCircle className="h-5 w-5 text-green-600" />
    return <Info className="h-5 w-5 text-blue-600" />
  }

  const getStyles = () => {
    if (isError) return "bg-red-50 border-red-200 text-red-800"
    if (isSuccess) return "bg-green-50 border-green-200 text-green-800"
    return "bg-blue-50 border-blue-200 text-blue-800"
  }

  return (
    <Card className={`border-0 shadow-lg ${getStyles()}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <p className="text-sm font-medium">{displayMessage}</p>
        </div>
      </CardContent>
    </Card>
  )
}
