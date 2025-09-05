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
  // @ts-ignore
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
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
    fetchJobs();
  }, [searchTerm, categoryFilter, minBudget, maxBudget]);

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
        query = query.eq("category", categoryFilter);
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
    { key: "web_dev", label: "Web Development" },
    { key: "mobile_dev", label: "Mobile Development" },
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
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="relative flex-auto flex-wrap">
              <Input
                placeholder="Search jobs..."
                startContent={<Search />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Budget Filters */}
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
            {/* Category Filter */}
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
              {(category) => <SelectItem>{category.label}</SelectItem>}
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

                  <div className="flex justify-end">
                    <Link href={`/employee/jobs/details?id=${job.id}`}>
                      <Button color="primary" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View & Apply
                      </Button>
                    </Link>
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
