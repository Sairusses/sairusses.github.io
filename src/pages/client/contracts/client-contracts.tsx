import { useEffect, useState } from "react";
import { Card, CardHeader } from "@heroui/card";
import { Button, Chip, Input } from "@heroui/react";
import { Eye, FileText } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";

export default function ClientContracts() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `
        id,
        status,
        jobs ( title ),
        users!contracts_employee_id_fkey ( full_name )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      setContracts(data || []);
    }
    setLoading(false);
  };

  const filteredContracts = contracts.filter((contract) => {
    const jobTitle = contract.jobs?.title?.toLowerCase() || "";
    const employeeName = contract.users?.full_name?.toLowerCase() || "";

    return (
      jobTitle.includes(search.toLowerCase()) ||
      employeeName.includes(search.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "primary";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <>
      <ClientNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6" /> My Contracts
        </h1>

        {/* Search Bar */}
        <Input
          className="mb-6"
          placeholder="Search by job title or employee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
          </div>
        ) : filteredContracts.length === 0 ? (
          <p>No contracts found.</p>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-2 transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer"
                shadow="sm"
              >
                <CardHeader className="flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold">
                      {contract.jobs?.title || "Untitled Job"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      Employee: {contract.users?.full_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip
                      color={getStatusColor(contract.status)}
                      size="sm"
                      variant="flat"
                    >
                      {contract.status}
                    </Chip>
                    <Button
                      as="a"
                      className="transition-all hover:bg-primary-600"
                      color="primary"
                      href={`/client/contracts/details?id=${contract.id}`}
                      size="sm"
                      startContent={<Eye />}
                    >
                      View
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
