import { useEffect, useState } from "react";
import { Card, CardHeader } from "@heroui/card";
import { Button, Link, addToast } from "@heroui/react";
import { Eye } from "lucide-react";

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
        .select("*, job:jobs(id, title, description)")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

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
        <h1 className="text-2xl font-bold mb-2">My Proposals</h1>
        <p className="text-gray-600 mb-6">
          Here you can view and manage all the proposals you’ve submitted.
        </p>

        {proposals.length === 0 ? (
          <div className="text-center text-gray-600">
            You haven’t submitted any proposals yet.
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <Card
                key={proposal.id}
                className="px-4 py-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                radius="sm"
                shadow="sm"
              >
                <CardHeader className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{proposal.job?.title}</h2>
                    <p className="text-gray-600 text-sm">
                      {proposal.job?.description}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Link href={`/employee/proposals/details?id=${proposal.id}`}>
                      <Button color="primary" startContent={<Eye />}>
                        View
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
