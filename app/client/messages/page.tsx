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
  getAllUsers,
  createOrGetChatThread,
  type ChatThread,
  type ChatMessage,
  type FreelancerProfile,
} from "@/lib/freelancer-firestore"
import { MessageSquare, Send, ArrowLeft, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function MessagesPage() {
  const { userProfile } = useAuth()
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([])
  const [allUsers, setAllUsers] = useState<FreelancerProfile[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatThread | null>(null)
  const [selectedUser, setSelectedUser] = useState<FreelancerProfile | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showUserList, setShowUserList] = useState(false)

  useEffect(() => {
    if (userProfile) {
      loadChatThreads()
      loadAllUsers()
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

      // Enhance threads with participant info
      const enhancedThreads = await Promise.all(
          threads.map(async (thread) => {
            const otherUserId = thread.participants.find((id) => id !== userProfile.uid)
            if (otherUserId) {
              try {
                const users = await getAllUsers(userProfile.uid)
                const otherUser = users.find((u) => u.uid === otherUserId)
                return {
                  ...thread,
                  otherUserName: otherUser?.username || otherUser?.email || "Unknown User",
                  otherUserRole: otherUser?.role || "user",
                }
              } catch (error) {
                console.error("Error fetching user info:", error)
                return {
                  ...thread,
                  otherUserName: "Unknown User",
                  otherUserRole: "user",
                }
              }
            }
            return thread
          }),
      )

      setChatThreads(enhancedThreads)
    } catch (error) {
      console.error("Error loading chat threads:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    if (!userProfile) return

    try {
      const users = await getAllUsers(userProfile.uid)
      setAllUsers(users)
    } catch (error) {
      console.error("Error loading users:", error)
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
    if (!userProfile || !newMessage.trim()) return

    let chatId = selectedChat?.id

    // If no chat selected but user selected, create new chat
    if (!chatId && selectedUser) {
      try {
        chatId = await createOrGetChatThread(userProfile.uid, selectedUser.uid)
        // Reload chat threads to include the new one
        await loadChatThreads()
        // Find and select the new chat
        const newThread = {
          id: chatId,
          participants: [userProfile.uid, selectedUser.uid],
          lastMessage: "",
          lastMessageTime: new Date(),
          otherUserName: selectedUser.username || selectedUser.email,
          otherUserRole: selectedUser.role,
        }
        setSelectedChat(newThread)
        setSelectedUser(null)
        setShowUserList(false)
      } catch (error) {
        console.error("Error creating chat:", error)
        return
      }
    }

    if (!chatId) return

    setSendingMessage(true)
    try {
      await sendMessage(chatId, {
        chatId,
        senderId: userProfile.uid,
        senderName: userProfile.username || userProfile.email,
        message: newMessage.trim(),
        read: false,
      })

      setNewMessage("")
      loadMessages(chatId)
      loadChatThreads() // Refresh to update last message
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

  const handleStartChat = (user: FreelancerProfile) => {
    setSelectedUser(user)
    setSelectedChat(null)
    setMessages([])
    setShowUserList(false)
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
          <div className={cn("lg:col-span-1", (selectedChat || selectedUser) && "hidden lg:block")}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setShowUserList(!showUserList)}>
                    <Users className="h-4 w-4 mr-2" />
                    {showUserList ? "Chats" : "Users"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {showUserList ? (
                    // User List
                    <div className="divide-y max-h-96 overflow-y-auto">
                      {allUsers.length === 0 ? (
                          <div className="p-6 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                            <p className="text-gray-600">Check back later for other users to chat with.</p>
                          </div>
                      ) : (
                          allUsers.map((user) => (
                              <div
                                  key={user.uid}
                                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => handleStartChat(user)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{user.username || user.email}</h4>
                                    <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                                    {user.skills && user.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {user.skills.slice(0, 2).map((skill) => (
                                              <Badge key={skill} variant="outline" className="text-xs">
                                                {skill}
                                              </Badge>
                                          ))}
                                        </div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Say hi to {user.username || user.email}!</p>
                              </div>
                          ))
                      )}
                    </div>
                ) : (
                    // Chat Threads
                    <div className="divide-y">
                      {chatThreads.length === 0 ? (
                          <div className="p-6 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                            <p className="text-gray-600 mb-4">Start a conversation by clicking "Users" above.</p>
                          </div>
                      ) : (
                          chatThreads.map((thread) => (
                              <div
                                  key={thread.id}
                                  className={cn(
                                      "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                                      selectedChat?.id === thread.id && "bg-blue-50 border-r-2 border-blue-600",
                                  )}
                                  onClick={() => {
                                    setSelectedChat(thread)
                                    setSelectedUser(null)
                                  }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900">{thread.otherUserName}</h4>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {thread.otherUserRole}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-1">{thread.lastMessage || "No messages yet"}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(thread.lastMessageTime, { addSuffix: true })}
                                </p>
                              </div>
                          ))
                      )}
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className={cn("lg:col-span-2", !selectedChat && !selectedUser && "hidden lg:block")}>
            {selectedChat || selectedUser ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Button
                          variant="ghost"
                          size="sm"
                          className="lg:hidden"
                          onClick={() => {
                            setSelectedChat(null)
                            setSelectedUser(null)
                          }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-lg">
                          {selectedChat?.otherUserName || selectedUser?.username || selectedUser?.email}
                        </CardTitle>
                        <p className="text-sm text-gray-600 capitalize">
                          {selectedChat?.otherUserRole || selectedUser?.role}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedUser && !selectedChat && (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Start a conversation with {selectedUser.username || selectedUser.email}
                          </h3>
                          <p className="text-gray-600">Send your first message below!</p>
                        </div>
                    )}
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
                      <p className="text-gray-600">Choose a chat from the list or start a new conversation.</p>
                    </div>
                  </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
  )
}
