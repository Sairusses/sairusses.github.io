import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, Eye, Edit, Trash2 } from "lucide-react";
import {
  addToast,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Link,
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar.tsx";

export default function ClientJobsListPage() {
  const [user, setUser] = useState<any>(null);

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

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const supabase = getSupabaseClient();

  useEffect(() => {
    fetchUser();
  }, []);
  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user, searchTerm, statusFilter]);

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
      }

      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) console.error("Error fetching jobs:", error);
      setJobs(data || []);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) {
        addToast({
          title: "Error deleting job",
          description: error.message,
          color: "danger",
        });
      }

      if (!error) {
        addToast({
          title: "Job deleted",
          description: "The job has been deleted successfully.",
          color: "success",
        });
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      }
    } catch (error: any) {
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "default";
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">My Jobs</h1>
            <Link href="/client/post-job">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 flex-wrap h-20 items-center">
            <div className="relative flex-auto">
              <Input
                placeholder="Search your jobs..."
                startContent={<Search />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              className="max-w-40"
              placeholder="All Status"
              selectedKeys={statusFilter ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                setStatusFilter(value === "all" ? "" : value);
              }}
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="open">Open</SelectItem>
              <SelectItem key="in_progress">In Progress</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="cancelled">Cancelled</SelectItem>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="hover:shadow-lg transition-shadow p-3"
                radius="sm"
                shadow="sm"
              >
                <CardHeader>
                  <div className="flex justify-between w-full items-start">
                    <div className="flex-1">
                      <div className="text-xl mb-2 font-bold capitalize">
                        {job.title}
                      </div>
                      <div className="text-base text-gray-600">
                        {job.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip color={getStatusColor(job.status)} radius="sm">
                        {job.status}
                      </Chip>
                      {job.budget_min && job.budget_max && (
                        <div className="flex items-center font-semibold">
                          &#8369; {job.budget_min} - &#8369; {job.budget_max}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-wrap gap-4 mb-4">
                    {job.category && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Filter className="h-4 w-4 mr-1" />
                        {job.category}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.required_skills.map((skill, index) => (
                        <Chip key={index} color="default" radius="sm">
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500" />
                    <div className="flex gap-2">
                      <Link href={`/client/jobs/details?id=${job.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/client/jobs/edit/${job.id}`}>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        color="danger"
                        size="sm"
                        variant="shadow"
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {jobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter
                    ? "Try adjusting your search criteria"
                    : "You haven't posted any jobs yet"}
                </p>
                <Link href="/jobs/post">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Post Your First Job
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
