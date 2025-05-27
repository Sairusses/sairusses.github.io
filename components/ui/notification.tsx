"use client"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationProps {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
  onRemove: (id: string) => void
}

export function Notification({ id, title, description, variant = "default", onRemove }: NotificationProps) {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300",
        variant === "destructive" ? "bg-red-50 border-red-200 text-red-900" : "bg-white border-gray-200 text-gray-900",
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
        </div>
        <button onClick={() => onRemove(id)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
