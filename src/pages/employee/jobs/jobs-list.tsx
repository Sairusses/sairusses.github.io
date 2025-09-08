import type { Job } from "@/lib/types";

import { useState, useEffect } from "react";
import { Search, Filter, Eye } from "lucide-react";
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
import EmployeeNavbar from "@/pages/employee/employee-navbar.tsx";

export default function EmployeeJobsPage() {
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");

  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
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

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchEmployeeApplications();
    }
  }, [user, searchTerm, categoryFilter, minBudget, maxBudget]);

  const fetchEmployeeApplications = async () => {
    try {
      const { data: proposals } = await supabase
        .from("proposals")
        .select("job_id")
        .eq("employee_id", user.id);

      const { data: contracts } = await supabase
        .from("contracts")
        .select("job_id")
        .eq("employee_id", user.id);

      const ids = [
        ...(proposals?.map((p) => p.job_id) || []),
        ...(contracts?.map((c) => c.job_id) || []),
      ];

      setAppliedJobIds(ids);
    } catch (err) {
      throw err;
    }
  };

  const fetchJobs = async () => {
    try {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`,
        );
      }

      if (categoryFilter) {
        const normalizedCategory = categoryFilter
          .replace("_", " ")
          .toLowerCase();

        query = query.eq("category", normalizedCategory);
      }

      if (minBudget) {
        query = query.gte("budget_min", Number(minBudget));
      }

      if (maxBudget) {
        query = query.lte("budget_max", Number(maxBudget));
      }

      const { data, error } = await query;

      if (error) {
        addToast({
          title: "Error fetching jobs",
          description: error.message,
        });
      }
      setJobs(data || []);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: "web_development", label: "Web Development" },
    { key: "mobile_development", label: "Mobile Development" },
    { key: "design", label: "Design" },
    { key: "writing", label: "Writing" },
    { key: "marketing", label: "Marketing" },
    { key: "data_science", label: "Data Science" },
    { key: "other", label: "Other" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start mt-4">
            <Input
              placeholder="Search jobs..."
              startContent={<Search />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Input
              className="max-w-30"
              placeholder="Min Budget"
              type="number"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
            />
            <Input
              className="max-w-30"
              placeholder="Max Budget"
              type="number"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
            <Select
              className="max-w-40"
              items={categories}
              label="Category"
              placeholder="All Categories"
              selectedKeys={categoryFilter ? [categoryFilter] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;

                setCategoryFilter(value === "all" ? "" : value);
              }}
            >
              {(category) => (
                <SelectItem key={category.key}>{category.label}</SelectItem>
              )}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => {
              const alreadyApplied = appliedJobIds.includes(job.id);
              // TS2345: Argument of type string is not assignable to parameter of type number

              return (
                <Card
                  key={job.id}
                  className="hover:shadow-lg transition-shadow p-3"
                  radius="sm"
                  shadow="sm"
                >
                  <CardHeader>
                    <div className="flex justify-between w-full items-start">
                      <div className="flex-1">
                        <div className="text-xl font-bold capitalize">
                          {job.title}
                        </div>
                        <div className="text-medium mb-2 text-gray-800">
                          {job.client_name}
                        </div>
                        <div className="text-base text-gray-600">
                          {job.description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.budget_min && job.budget_max && (
                          <div className="flex items-center font-semibold">
                            &#8369; {job.budget_min} - &#8369; {job.budget_max}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2">
                      <div>
                        <div className="flex flex-wrap gap-4 mb-4">
                          {job.category && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Filter className="h-4 w-4 mr-1" />
                              {job.category}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Posted{" "}
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {Array.isArray(job.required_skills) &&
                          job.required_skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.required_skills.map((skill, index) => (
                                <Chip key={index} color="default" radius="sm">
                                  {skill}
                                </Chip>
                              ))}
                            </div>
                          )}
                      </div>

                      <div className="flex justify-end">
                        {alreadyApplied ? (
                          <Button disabled color="default" size="sm">
                            Already Applied
                          </Button>
                        ) : (
                          <Link href={`/employee/jobs/details?id=${job.id}`}>
                            <Button color="primary" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View & Apply
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}

            {jobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || categoryFilter || minBudget || maxBudget
                    ? "Try adjusting your search criteria"
                    : "No jobs are currently available"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
