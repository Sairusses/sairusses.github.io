"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  getChatThreads,
  getChatMessages,
  sendMessage,
  type ChatThread,
  type ChatMessage,
} from "@/lib/freelancer-firestore"
import { MessageSquare, Send, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { userProfile } = useAuth()
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    if (userProfile) {
      loadChatThreads()
    }
  }, [userProfile])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  const loadChatThreads = async () => {
    if (!userProfile) return

    try {
      const threads = await getChatThreads(userProfile.uid)
      setChatThreads(threads)
    } catch (error) {
      console.error("Error loading chat threads:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (chatId: string) => {
    try {
      const messagesData = await getChatMessages(chatId)
      setMessages(messagesData)
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !userProfile || !newMessage.trim()) return

    setSendingMessage(true)
    try {
      await sendMessage(selectedChat.id, {
        chatId: selectedChat.id,
        senderId: userProfile.uid,
        senderName: userProfile.name || userProfile.email,
        message: newMessage.trim(),
        read: false,
      })

      setNewMessage("")
      loadMessages(selectedChat.id)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className={cn("lg:col-span-1", selectedChat && "hidden lg:block")}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {chatThreads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600">Start a conversation with a client to see messages here.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {chatThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={cn(
                        "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedChat?.id === thread.id && "bg-blue-50 border-r-2 border-blue-600",
                      )}
                      onClick={() => setSelectedChat(thread)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{thread.clientName}</h4>
                        {thread.unreadCount > 0 && (
                          <Badge variant="default" className="bg-blue-600">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{thread.jobTitle}</p>
                      <p className="text-sm text-gray-500 line-clamp-1">{thread.lastMessage}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(thread.lastMessageTime, { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className={cn("lg:col-span-2", !selectedChat && "hidden lg:block")}>
          {selectedChat ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSelectedChat(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg">{selectedChat.clientName}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedChat.jobTitle}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex", message.senderId === userProfile?.uid ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.senderId === userProfile?.uid ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
                      )}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.senderId === userProfile?.uid ? "text-blue-100" : "text-gray-500",
                        )}
                      >
                        {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a chat from the list to start messaging.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
