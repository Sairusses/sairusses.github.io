import { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar, Link, addToast } from "@heroui/react";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";
import { Proposal } from "@/lib/types";

export default function ClientProposalsList() {
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
          description: "You must be logged in as a client to view proposals.",
          color: "danger",
        });

        return;
      }

      // fetch all proposals for jobs created by this client
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
          id,
          proposed_rate,
          estimated_duration,
          job:jobs(id, title, client_id),
          employee:users(id, full_name, avatar_url)
        `,
        )
        .eq("job.client_id", user.id) // only jobs posted by this client
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProposals(data as unknown as Proposal[]);
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
      <ClientNavbar />
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Proposals for My Jobs</h1>

        {proposals.length === 0 ? (
          <div className="text-center text-gray-600">
            No proposals have been submitted yet.
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/client/proposals/details?id=${proposal.id}`}
              >
                <Card
                  isPressable
                  className="hover:shadow-md transition-shadow cursor-pointer"
                >
                  <CardBody className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <Avatar
                        alt={proposal.employee?.full_name}
                        radius="full"
                        size="md"
                        src={proposal.employee?.avatar_url || ""}
                      />
                      <div>
                        <h2 className="font-semibold text-lg">
                          {proposal.job?.title}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {proposal.employee?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className="w-full flex flex-row justify-between">
                      <div className="text-left">
                        <p className="text-sm text-gray-500">
                          Estimated Duration
                        </p>
                        <p className="font-bold text-blue-600">
                            {proposal.estimated_duration}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Proposed Rate</p>
                        <p className="font-bold text-blue-600">
                          ₱{proposal.proposed_rate}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
