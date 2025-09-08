import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button, Chip, Link, addToast } from "@heroui/react";
import { Clock, Eye, File } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar";
import { Proposal } from "@/lib/types.ts";

export default function EmployeeProposalsPage() {
  const supabase = getSupabaseClient();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        addToast({
          title: "Not logged in",
          description:
            "You must be logged in as an employee to view proposals.",
          color: "danger",
        });

        return;
      }

      const { data, error } = await supabase
        .from("proposals")
        .select("*, job:jobs(id, title, description, client_name)")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setProposals(data as Proposal[]);
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      addToast({
        title: "Error",
        description: err.message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">My Proposals</h1>

        {proposals.length === 0 ? (
          <div className="text-center text-gray-600">
            You haven’t submitted any proposals yet.
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                className="px-4 py-2"
                radius="sm"
                shadow="sm"
              >
                <CardHeader className="flex justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {proposal.job?.title}
                    </h2>
                    <h2 className="text-medium mb-2">
                      {proposal.job?.client_name}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {proposal.job?.description}
                    </p>
                  </div>
                  <Chip
                    color={
                      proposal.status === "pending"
                        ? "warning"
                        : proposal.status === "accepted"
                          ? "success"
                          : "danger"
                    }
                    radius="sm"
                  >
                    {proposal.status}
                  </Chip>
                </CardHeader>

                <CardBody>
                  <div className="mb-4">
                    <p className="text-gray-700">
                      <span className="font-semibold">Cover Letter: </span>
                      {proposal.cover_letter}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold">Rate: </span>₱
                      {proposal.proposed_rate}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {proposal.estimated_duration}
                    </div>
                    <div>
                      <span className="font-semibold">Submitted: </span>
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Attachments + View Button */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Column 1: Attachments */}
                    {Array.isArray(proposal.attachments) &&
                      proposal.attachments.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Attachments</h3>
                          <ul className="list-disc space-y-2">
                            {proposal.attachments.map((file: any, index) => {
                              let parsed;

                              try {
                                parsed = JSON.parse(file);
                              } catch {
                                return null;
                              }

                              return (
                                <li key={index}>
                                  <Link
                                    className="flex items-center gap-2 text-blue-600 hover:underline max-w-sm"
                                    href={parsed.url}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                  >
                                    <Button
                                      fullWidth
                                      className="justify-start border border-gray-400"
                                      color="default"
                                      radius="full"
                                      startContent={
                                        <File className="h-4 w-4" />
                                      }
                                      variant="solid"
                                    >
                                      {parsed.name}
                                    </Button>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                    {/* Column 2: View Button */}
                    <div className="flex items-end justify-end">
                      <Link
                        href={`employee/proposals/details?id=${proposal.id}`}
                      >
                        <Button color="primary" startContent={<Eye />}>
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
