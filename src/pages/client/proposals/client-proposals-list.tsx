import { useEffect, useState, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";
import { Avatar, Link, addToast } from "@heroui/react";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";
import { Proposal } from "@/lib/types";

// Define a type for the grouped data structure
type GroupedProposals = {
  [jobTitle: string]: Proposal[];
};

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
      // ✨ NEW CORRECTED QUERY BLOCK ✨
      const { data, error } = await supabase
        .from("proposals")
        .select(
          `
    id,
    proposed_rate,
    estimated_duration,
    job:jobs!inner(id, title, client_id), 
    employee:users(id, full_name, avatar_url)
  `,
        )
        .eq("job.client_id", user.id) // <--- Keep this for filtering the main table proposals
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      // NOTE: This .eq('job.client_id', user.id) works because Supabase/Postgrest is often smart enough to apply it.
      // However, the SAFEST and most explicit way is to filter the job table data itself.

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

  // --- New Logic: Group proposals by Job Title ---
  const groupedProposals = useMemo(() => {
    return proposals.reduce((acc: GroupedProposals, proposal) => {
      // Safely access the job title. Use a fallback if job data is missing.
      const jobTitle = proposal.job?.title || "Unknown Job";

      if (!acc[jobTitle]) {
        acc[jobTitle] = [];
      }

      acc[jobTitle].push(proposal);

      return acc;
    }, {});
  }, [proposals]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <ClientNavbar />

      <main className="max-w-7xl mx-auto py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Proposal Management
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Review and manage submissions for your job postings.
          </p>
        </header>

        {/* Empty State */}
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md border border-gray-100 py-14 px-6 text-center">
            <svg
              className="h-14 w-14 text-blue-500 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              No Proposals Yet
            </h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              Submissions will appear here once applicants send proposals to your jobs.
            </p>
          </div>
        ) : (
          <div className="space-y-10 lg:space-y-12">
            {Object.keys(groupedProposals).map((jobTitle) => (
              <section key={jobTitle} className="space-y-6">
                {/* Job Header with grid layout */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 grid grid-cols-2 items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                    {jobTitle}
                  </h2>
                  <div className="justify-self-end">
                  <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full whitespace-nowrap">
                    {groupedProposals[jobTitle].length}{" "}
                    {groupedProposals[jobTitle].length > 1
                      ? "Proposals"
                      : "Proposal"}
                  </span>
                  </div>
                </div>

                {/* Proposal Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedProposals[jobTitle].map((proposal) => (
                    <Link
                      key={proposal.id}
                      href={`/client/proposals/details?id=${proposal.id}`}
                      className="block w-full"
                    >
                      <Card
                        isPressable
                        className="w-full h-full bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-transform duration-300"
                      >
                        <CardBody className="p-6 flex flex-col justify-between h-full">
                          {/* Top: Employee Info */}
                          <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                            <Avatar
                              alt={proposal.employee?.full_name}
                              radius="full"
                              size="lg"
                              src={proposal.employee?.avatar_url || ""}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">
                                {proposal.employee?.full_name}
                              </p>
                              <p className="text-sm text-blue-600 font-medium">
                                View Profile
                              </p>
                            </div>
                          </div>

                          {/* Bottom: Rate and Duration */}
                          <div className="flex justify-between items-end gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Duration
                              </p>
                              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                                {proposal.estimated_duration}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Proposed Rate
                              </p>
                              <p className="font-bold text-blue-600 text-lg sm:text-2xl">
                                ₱{proposal.proposed_rate}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );

}
