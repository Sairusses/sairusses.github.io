"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare } from "lucide-react"
import Navbar from "@/components/navbar"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase"
import type { Contract, Message, Proposal } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export default function ChatPage() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const subscriptionRef = useRef<any>(null)
  const supabase = getSupabaseClient()

  const searchParams = useSearchParams()
  const contractId = searchParams.get("contract")
  const proposalId = searchParams.get("proposal")

  // Cleanup subscription function
  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (userProfile) {
      fetchConversations()
    }
  }, [userProfile])

  useEffect(() => {
    if (selectedContract || selectedProposal) {
      fetchMessages()
      subscribeToMessages()
    } else {
      cleanupSubscription()
    }

    // Cleanup on unmount or when conversation changes
    return cleanupSubscription
  }, [selectedContract, selectedProposal, cleanupSubscription])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initial load - check if we need to select a specific conversation
  useEffect(() => {
    if (contractId || proposalId) {
      handleInitialSelection()
    }
  }, [contractId, proposalId, contracts, proposals])

  const handleInitialSelection = () => {
    if (contractId && contracts.length > 0) {
      const contract = contracts.find((c) => c.id === contractId)
      if (contract) {
        setSelectedContract(contract)
        setSelectedProposal(null)
      }
    } else if (proposalId && proposals.length > 0) {
      const proposal = proposals.find((p) => p.id === proposalId)
      if (proposal) {
        setSelectedProposal(proposal)
        setSelectedContract(null)
      }
    }
  }

  const fetchConversations = async () => {
    try {
      // Fetch contracts with explicit joins to avoid ambiguity
      const { data: contractsData, error: contractsError } = await supabase
        .from("contracts")
        .select(`
          *,
          job:jobs(*),
          client:users!contracts_client_id_fkey(*),
          employee:users!contracts_employee_id_fkey(*)
        `)
        .or(`client_id.eq.${userProfile?.id},employee_id.eq.${userProfile?.id}`)
        .order("created_at", { ascending: false })

      if (contractsError) throw contractsError
      setContracts(contractsData || [])

      // Fetch proposals with messages
      const role = userProfile?.role
      let proposalsQuery = supabase
        .from("proposals")
        .select(`
          *,
          job:jobs(*),
          employee:users!proposals_employee_id_fkey(*)
        `)
        .order("created_at", { ascending: false })

      if (role === "client") {
        // Get proposals for client's jobs
        const { data: clientJobs } = await supabase.from("jobs").select("id").eq("client_id", userProfile?.id)

        if (clientJobs && clientJobs.length > 0) {
          proposalsQuery = proposalsQuery.in(
            "job_id",
            clientJobs.map((job) => job.id),
          )
        }
      } else {
        // Get employee's proposals
        proposalsQuery = proposalsQuery.eq("employee_id", userProfile?.id)
      }

      const { data: proposalsData, error: proposalsError } = await proposalsQuery

      if (proposalsError) throw proposalsError

      // Only include proposals that have messages
      if (proposalsData && proposalsData.length > 0) {
        const proposalIds = proposalsData.map((p) => p.id)
        const { data: proposalsWithMessages } = await supabase
          .from("messages")
          .select("proposal_id")
          .in("proposal_id", proposalIds)
          .not("proposal_id", "is", null)

        if (proposalsWithMessages && proposalsWithMessages.length > 0) {
          const proposalIdsWithMessages = proposalsWithMessages.map((p) => p.proposal_id)
          const filteredProposals = proposalsData.filter(
            (p) => proposalIdsWithMessages.includes(p.id) || p.id === proposalId,
          )

          // Add client info for proposals
          const proposalsWithClient = await Promise.all(
            filteredProposals.map(async (proposal) => {
              const { data: clientData } = await supabase
                .from("users")
                .select("*")
                .eq("id", proposal.job?.client_id)
                .single()

              return {
                ...proposal,
                client: clientData,
              }
            }),
          )

          setProposals(proposalsWithClient)
        } else if (proposalId) {
          // If no proposals with messages but we have a proposalId param
          const specificProposal = proposalsData.find((p) => p.id === proposalId)
          if (specificProposal) {
            const { data: clientData } = await supabase
              .from("users")
              .select("*")
              .eq("id", specificProposal.job?.client_id)
              .single()

            setProposals([
              {
                ...specificProposal,
                client: clientData,
              },
            ])
          }
        } else {
          setProposals([])
        }
      }

      // Set default selection if needed
      if (!selectedContract && !selectedProposal) {
        if (contractId && contractsData) {
          const contract = contractsData.find((c) => c.id === contractId)
          if (contract) {
            setSelectedContract(contract)
          }
        } else if (proposalId && proposalsData) {
          const proposal = proposalsData.find((p) => p.id === proposalId)
          if (proposal) {
            setSelectedProposal(proposal)
          }
        } else if (contractsData && contractsData.length > 0) {
          setSelectedContract(contractsData[0])
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedContract && !selectedProposal) return

    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          sender:users(*)
        `)
        .order("created_at", { ascending: true })

      if (selectedContract) {
        query = query.eq("contract_id", selectedContract.id)
      } else if (selectedProposal) {
        query = query.eq("proposal_id", selectedProposal.id)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const subscribeToMessages = useCallback(() => {
    if (!selectedContract && !selectedProposal) return

    // Clean up any existing subscription first
    cleanupSubscription()

    let channelId = ""
    let filter = ""

    if (selectedContract) {
      channelId = `contract-${selectedContract.id}`
      filter = `contract_id=eq.${selectedContract.id}`
    } else if (selectedProposal) {
      channelId = `proposal-${selectedProposal.id}`
      filter = `proposal_id=eq.${selectedProposal.id}`
    }

    try {
      subscriptionRef.current = supabase
        .channel(channelId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: filter,
          },
          (payload) => {
            fetchMessages() // Refetch to get sender info
          },
        )
        .subscribe()
    } catch (error) {
      console.error("Error subscribing to messages:", error)
    }
  }, [selectedContract, selectedProposal, cleanupSubscription])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || (!selectedContract && !selectedProposal) || !userProfile) return

    setSending(true)
    try {
      const messageData: any = {
        sender_id: userProfile.id,
        content: newMessage.trim(),
      }

      if (selectedContract) {
        messageData.contract_id = selectedContract.id
      } else if (selectedProposal) {
        messageData.proposal_id = selectedProposal.id
      }

      const { error } = await supabase.from("messages").insert(messageData)

      if (error) throw error
      setNewMessage("")
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getOtherParty = (item: Contract | Proposal) => {
    if ("client_id" in item && "employee_id" in item) {
      // It's a contract
      return userProfile?.role === "client" ? item.employee : item.client
    } else {
      // It's a proposal
      return userProfile?.role === "client" ? item.employee : item.client
    }
  }

  const selectConversation = (item: Contract | Proposal) => {
    if ("client_id" in item && "employee_id" in item) {
      // It's a contract
      setSelectedContract(item)
      setSelectedProposal(null)
    } else {
      // It's a proposal
      setSelectedProposal(item)
      setSelectedContract(null)
    }
  }

  const getCurrentConversation = () => {
    return selectedContract || selectedProposal
  }

  const getConversationTitle = (item: Contract | Proposal) => {
    if ("job" in item && item.job) {
      return item.job.title
    }
    return "Conversation"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const allConversations = [
    ...contracts.map((c) => ({ ...c, type: "contract" })),
    ...proposals.map((p) => ({ ...p, type: "proposal" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const currentConversation = getCurrentConversation()
  const otherParty = currentConversation ? getOtherParty(currentConversation) : null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
            <p className="text-gray-600">Communicate with your clients and freelancers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {allConversations.map((item: any) => {
                    const otherParty = getOtherParty(item)
                    const isSelected =
                      (item.type === "contract" && selectedContract?.id === item.id) ||
                      (item.type === "proposal" && selectedProposal?.id === item.id)

                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => selectConversation(item)}
                        className={`w-full p-4 text-left hover:bg-gray-50 border-b transition-colors ${
                          isSelected ? "bg-blue-50 border-blue-200" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={otherParty?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{otherParty?.full_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{otherParty?.full_name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600 truncate">{getConversationTitle(item)}</p>
                              {item.type === "proposal" && (
                                <Badge variant="outline" className="text-xs">
                                  Proposal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                  {allConversations.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a project or submit a proposal to begin messaging</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3 flex flex-col">
              {currentConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={otherParty?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{otherParty?.full_name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{otherParty?.full_name}</h3>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-600">{getConversationTitle(currentConversation)}</p>
                            {selectedProposal && <Badge variant="outline">Proposal Discussion</Badge>}
                          </div>
                        </div>
                      </div>
                      {selectedContract && <Badge variant="default">Active Contract</Badge>}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No messages yet</p>
                          <p className="text-sm">Start the conversation by sending a message</p>
                        </div>
                      )}
                      {messages.map((message) => {
                        const isOwn = message.sender_id === userProfile?.id
                        return (
                          <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                                {new Date(message.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <form onSubmit={sendMessage} className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
