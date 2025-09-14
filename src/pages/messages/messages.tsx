import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Input, Chip } from "@heroui/react";
import { MessageSquare, Send } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";
import EmployeeNavbar from "@/pages/employee/employee-navbar";

export default function MessagesPage() {
  const supabase = getSupabaseClient();

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch logged-in user
  useEffect(() => {
    const getUserProfile = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) return;

      const { data, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileError) {
        setUserProfile(data);
      }
      setLoading(false);
    };

    getUserProfile();
  }, []);

  // Fetch conversations
  useEffect(() => {
    if (!userProfile) return;

    const fetchConversations = async () => {
      const { data: proposals } = await supabase
        .from("proposals")
        .select("*, client:client_id(*), employee:employee_id(*)")
        .or(`client_id.eq.${userProfile.id},employee_id.eq.${userProfile.id}`);

      const { data: contracts } = await supabase
        .from("contracts")
        .select("*, client:client_id(*), employee:employee_id(*)")
        .or(`client_id.eq.${userProfile.id},employee_id.eq.${userProfile.id}`);

      const combined = [
        ...(proposals?.map((p) => ({ ...p, type: "proposal" })) || []),
        ...(contracts?.map((c) => ({ ...c, type: "contract" })) || []),
      ];

      setConversations(combined);
    };

    fetchConversations();
  }, [userProfile]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      let query = supabase.from("messages").select("*").order("created_at");

      if (selectedConversation.type === "contract") {
        query = query.eq("contract_id", selectedConversation.id);
      } else {
        query = query.eq("proposal_id", selectedConversation.id);
      }

      const { data } = await query;

      setMessages(data || []);
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;

          if (
            (selectedConversation.type === "contract" &&
              msg.contract_id === selectedConversation.id) ||
            (selectedConversation.type === "proposal" &&
              msg.proposal_id === selectedConversation.id)
          ) {
            setMessages((prev) => {
              // avoid duplicates if optimistic already added
              if (prev.some((m) => m.id === msg.id)) return prev;

              return [...prev, msg];
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile || !selectedConversation) return;

    const tempId = Date.now(); // temporary id for UI
    const optimisticMessage = {
      id: tempId,
      sender_id: userProfile.id,
      content: newMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]); // update UI immediately
    setNewMessage("");

    const messageData: any = {
      sender_id: userProfile.id,
      content: optimisticMessage.content,
    };

    if (selectedConversation.type === "contract") {
      messageData.contract_id = selectedConversation.id;
    } else {
      messageData.proposal_id = selectedConversation.id;
    }

    const { error, data } = await supabase
      .from("messages")
      .insert([messageData])
      .select()
      .single();

    if (error) {
      // rollback if failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.error(error);
    } else {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userProfile?.role === "client" ? <ClientNavbar /> : <EmployeeNavbar />}

      <div className="max-w-7xl mx-auto py-4 px-4">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[550px]">
          {/* Sidebar */}
          <Card className="lg:col-span-1" radius="sm" shadow="sm">
            <CardHeader>
              <strong className="px-4 text-lg">Conversations</strong>
            </CardHeader>
            <CardBody className="p-0 overflow-y-auto">
              {conversations.map((item) => {
                const other =
                  userProfile.role === "client" ? item.employee : item.client;

                const convoMessages = messages.filter((m) =>
                  item.type === "contract"
                    ? m.contract_id === item.id
                    : m.proposal_id === item.id,
                );
                const latestMessage =
                  convoMessages.length > 0
                    ? convoMessages[convoMessages.length - 1].content
                    : "No messages yet";

                return (
                  <button
                    key={item.id}
                    className={`w-full p-4 text-left border-b border-gray-200 ${
                      selectedConversation?.id === item.id
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedConversation(item)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={other?.full_name || "Unknown"}
                        src={other?.avatar_url || ""}
                      />
                      <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{other?.full_name}</p>
                          <Chip
                            color={
                              item.type === "contract" ? "success" : "primary"
                            }
                            size="sm"
                            variant="flat"
                          >
                            {item.type}
                          </Chip>
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">
                          {latestMessage}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {conversations.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <MessageSquare className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p>No conversations yet</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col" radius="sm" shadow="sm">
            {selectedConversation ? (
              <>
                <CardHeader className="px-6 border-b border-gray-200 flex items-center justify-between">
                  <strong>
                    {userProfile.role === "client"
                      ? selectedConversation.employee?.full_name
                      : selectedConversation.client?.full_name}
                  </strong>
                  <Chip
                    color={
                      selectedConversation.type === "contract"
                        ? "success"
                        : "primary"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {selectedConversation.type}
                  </Chip>
                </CardHeader>
                <CardBody className="flex flex-col p-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === userProfile.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2 rounded-lg max-w-xs ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form
                    className="p-4 border-t border-gray-200 flex gap-2"
                    onSubmit={sendMessage}
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button
                      color="primary"
                      isDisabled={!newMessage.trim()}
                      type="submit"
                    >
                      <Send size={16} />
                    </Button>
                  </form>
                </CardBody>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
