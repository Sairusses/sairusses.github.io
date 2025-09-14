import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Input, Button, Chip, Avatar, Link } from "@heroui/react";
import { Eye } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar";

export default function EmployeeContractsPage() {
  const supabase = getSupabaseClient();
  const [contracts, setContracts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  // @ts-ignore
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);

        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setUserProfile(profile);

      const { data, error } = await supabase
        .from("contracts")
        .select(
          `*, 
           clients:client_id(full_name, avatar_url, company_name), 
           jobs:job_id(title)`,
        )
        .eq("employee_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setContracts(data || []);
      }
      setLoading(false);
    };

    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter(
    (c) =>
      c.jobs?.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.clients?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="max-w-6xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">My Contracts</h1>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card radius="sm" shadow="sm">
          <CardBody className="divide-y">
            {loading ? (
              <div className="p-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
              </div>
            ) : filteredContracts.length > 0 ? (
              filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={contract.clients?.full_name || "Client"}
                      size="sm"
                      src={contract.clients?.avatar_url || ""}
                    />
                    <div>
                      <p className="font-medium">{contract.jobs?.title}</p>
                      <p className="text-sm text-gray-600">
                        {contract.clients?.full_name} •{" "}
                        {contract.clients?.company_name || "No Company"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip
                      color={
                        contract.status === "active"
                          ? "success"
                          : contract.status === "completed"
                            ? "secondary"
                            : "warning"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {contract.status}
                    </Chip>
                    <Link
                      href={`/employee/contracts/details?id=${contract.id}`}
                    >
                      <Button color="primary" size="sm" startContent={<Eye />}>
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No contracts found
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
