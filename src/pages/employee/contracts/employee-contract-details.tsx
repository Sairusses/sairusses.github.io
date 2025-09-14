import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Chip } from "@heroui/react";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar";

export default function EmployeeContractDetailsPage() {
  const supabase = getSupabaseClient();
  const location = useLocation();

  // get id from query string (?id=...)
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchContract = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `*, 
           clients:client_id(full_name, avatar_url, company_name, email), 
           jobs:job_id(title, description, category, timeline)`,
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
      } else {
        setContract(data);
      }
      setLoading(false);
    };

    fetchContract();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Contract Details</h1>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
          </div>
        ) : contract ? (
          <Card
            className="px-5 py-2 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
            radius="sm"
            shadow="sm"
          >
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={contract.clients?.full_name || "Client"}
                  src={contract.clients?.avatar_url || ""}
                />
                <div>
                  <p className="font-medium">{contract.clients?.full_name}</p>
                  <p className="text-sm text-gray-600">
                    {contract.clients?.company_name || "No company"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {contract.clients?.email}
                  </p>
                </div>
              </div>
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
            </CardHeader>

            <CardBody className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {contract.jobs?.title}
                </h2>
                <p className="text-gray-700">{contract.jobs?.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Category: {contract.jobs?.category || "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-medium">Agreed Rate</p>
                  <p className="text-gray-700">₱{contract.agreed_rate}</p>
                </div>
                <div>
                  <p className="font-medium">Timeline</p>
                  <p className="text-gray-700">
                    {contract.jobs?.timeline || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Start Date</p>
                  <p className="text-gray-700">
                    {contract.start_date
                      ? new Date(contract.start_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">End Date</p>
                  <p className="text-gray-700">
                    {contract.end_date
                      ? new Date(contract.end_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <p className="text-center text-gray-500">Contract not found</p>
        )}
      </div>
    </div>
  );
}
