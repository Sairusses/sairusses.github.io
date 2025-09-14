import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Avatar, Button, Chip, Link } from "@heroui/react";
import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";

export default function ClientContractDetailsPage() {
  const supabase = getSupabaseClient();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchContract();
  }, [id]);

  const fetchContract = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `*, 
         employees:employee_id(full_name, avatar_url, skills, email, hourly_rate, resume_url), 
         jobs:job_id(title, description, category, timeline)`
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

  const updateContractStatus = async (status: string) => {
    if (!id) return;
    setUpdating(true);
    const { error } = await supabase
      .from("contracts")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Failed to update contract status:", error);
    } else {
      setContract((prev: any) => ({ ...prev, status }));
    }
    setUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "primary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />

      <div className="max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Contract Details</h1>

        {loading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
          </div>
        ) : contract ? (
          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  name={contract.employees?.full_name || "Employee"}
                  src={contract.employees?.avatar_url || ""}
                />
                <div>
                  <p className="font-medium">{contract.employees?.full_name}</p>
                  <p className="text-sm text-gray-600">
                    {contract.employees?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Hourly Rate: ₱{contract.employees?.hourly_rate || "N/A"}
                  </p>
                </div>
              </div>
              <Chip
                color={getStatusColor(contract.status)}
                size="sm"
                variant="flat"
              >
                {contract.status}
              </Chip>
            </CardHeader>

            <CardBody className="space-y-6">
              {/* Job Info */}
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {contract.jobs?.title}
                </h2>
                <p className="text-gray-700">{contract.jobs?.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Category: {contract.jobs?.category || "N/A"}
                </p>
              </div>

              {/* Skills */}
              {contract.employees?.skills?.length > 0 && (
                <div>
                  <p className="font-medium">Skills</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {contract.employees.skills.map((skill: string) => (
                      <Chip key={skill} size="sm" variant="flat">
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {contract.employees?.resume_url && (
                <div>
                  <p className="font-medium">Resume</p>
                  <Link href={contract.employees.resume_url} target="_blank">
                    <Button>View Resume</Button>
                  </Link>
                </div>
              )}

              {/* Contract Details */}
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

              {/* Action Buttons */}
              {contract.status === "active" && (
                <div className="flex gap-4">
                  <Button
                    color="primary"
                    isDisabled={updating}
                    onClick={() => updateContractStatus("completed")}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    color="default"
                    isDisabled={updating}
                    onClick={() => updateContractStatus("cancelled")}
                  >
                    Cancel Contract
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <p className="text-center text-gray-500">Contract not found</p>
        )}
      </div>
    </div>
  );
}
