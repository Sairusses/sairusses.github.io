import type { Job, Proposal, Contract } from "@/lib/types";

import { useState, useEffect } from "react";
import { Briefcase, FileText, CheckCircle, Search, Eye } from "lucide-react";
import { addToast, Button, Card, CardHeader, Chip, Link } from "@heroui/react";
import { CardBody } from "@heroui/card";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar.tsx";

export default function EmployeeDashboard() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      }
      setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch recent open jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch user's proposals
      const { data: proposalsData } = await supabase
        .from("proposals")
        .select(
          `
          *,
          job:jobs(*)
        `,
        )
        .eq("employee_id", user?.id)
        .order("created_at", { ascending: false });

      // Fetch user's contracts
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(
          `
          *,
          job:jobs(*),
          client:users(*)
        `,
        )
        .eq("employee_id", user?.id)
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);
      setProposals(proposalsData || []);
      setContracts(contractsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const stats = {
    activeContracts: contracts.filter((c) => c.status === "active").length,
    pendingProposals: proposals.filter((p) => p.status === "pending").length,
    completedContracts: contracts.filter((c) => c.status === "completed")
      .length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.user_metadata?.fullName ?? "User"}
          </h1>
          <p className="text-gray-600">
            Find new opportunities and manage your work
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Active Contracts</div>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody>
              <div className="text-2xl font-bold">{stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground text-gray-600">
                Currently working on
              </p>
            </CardBody>
          </Card>

          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Pending Proposals</div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody>
              <div className="text-2xl font-bold">{stats.pendingProposals}</div>
              <p className="text-xs text-muted-foreground text-gray-600">
                Awaiting client response
              </p>
            </CardBody>
          </Card>

          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="text-sm font-medium">Completed Jobs</div>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardBody>
              <div className="text-2xl font-bold">
                {stats.completedContracts}
              </div>
              <p className="text-xs text-muted-foreground text-gray-600">
                Successfully finished
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Jobs */}
          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">Available Jobs</div>
                <div className="text-sm text-gray-600">
                  Latest opportunities for you
                </div>
              </div>
              <Link href="/employee/jobs">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse All
                </Button>
              </Link>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 flex flex-col">
                {jobs.slice(0, 5).map((job) => (
                  <Card key={job.id} radius="sm" shadow="sm">
                    <CardBody>
                      <div className="flex items-center justify-between p-4 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{job.title}</h3>
                          <p className="text-sm text-gray-600 truncate">
                            {job.client_name}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Chip
                              color={
                                job.status === "open" ? "default" : "primary"
                              }
                            >
                              {job.status}
                            </Chip>
                            {job.budget_min && job.budget_max && (
                              <span className="text-sm text-gray-500">
                                &#8369; {job.budget_min} - &#8369;{" "}
                                {job.budget_max}
                              </span>
                            )}
                          </div>
                          {job.required_skills &&
                            job.required_skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.required_skills
                                  .slice(0, 3)
                                  .map((skill, index) => (
                                    <Chip
                                      key={index}
                                      className="text-xs"
                                      variant="bordered"
                                    >
                                      {skill}
                                    </Chip>
                                  ))}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/employee/jobs/details?id=${job.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}

                {jobs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No jobs available</p>
                    <p className="text-sm">
                      Check back later for new opportunities
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* My Proposals */}
          <Card className="px-4 py-2" radius="sm" shadow="sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <div className="text-2xl font-bold">My Proposals</div>
                <div className="text-sm text-gray-600">
                  Track your submitted proposals
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {proposals.slice(0, 5).map((proposal) => (
                  <Card
                    key={proposal.id}
                    className="p-4 grid grid-cols-2 justify-between"
                    radius="sm"
                    shadow="sm"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{proposal.job?.title}</h3>
                      <p className="text-sm text-gray-600">
                        Submitted{" "}
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Chip
                          color={
                            proposal.status === "pending"
                              ? "default"
                              : proposal.status === "accepted"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {proposal.status}
                        </Chip>
                        {proposal.proposed_rate && (
                          <span className="text-sm text-gray-500">
                            ${proposal.proposed_rate}/hr
                          </span>
                        )}
                      </div>
                    </div>
                    <Link className="justify-end" href="/employee/proposals">
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </Card>
                ))}
                {proposals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No proposals yet</p>
                    <Link href="/employee/jobs">
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                        Browse Jobs
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
