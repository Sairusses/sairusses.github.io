"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useNotification } from "@/hooks/use-notification"
import { Notification } from "@/components/ui/notification"

interface NotificationContextType {
  notify: (notification: { title: string; description?: string; variant?: "default" | "destructive" }) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotify() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotify must be used within a NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { notifications, notify, removeNotification } = useNotification()

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} onRemove={removeNotification} />
      ))}
    </NotificationContext.Provider>
  )
}
