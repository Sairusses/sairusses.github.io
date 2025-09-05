import type { Job } from "@/lib/types";

import { useEffect, useState } from "react";
import { Button, Chip, Input, Textarea, addToast, Link } from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { DollarSign, Clock, Filter, File, User } from "lucide-react";
import { useLocation } from "react-router-dom";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar";

export default function EmployeeJobDetailsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const supabase = getSupabaseClient();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    if (id) fetchJob(id);
  }, [id]);

  const fetchJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        addToast({
          title: "Error fetching job",
          description: error.message,
        });
      }
      setJob(data as Job);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!proposal || !bidAmount) {
      addToast({
        title: "Missing fields",
        description: "Please enter a proposal and bid amount.",
        color: "warning",
      });

      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        addToast({
          title: "Not logged in",
          description: "You must be logged in as an employee to apply.",
          color: "danger",
        });

        return;
      }

      const { error } = await supabase.from("proposals").insert({
        job_id: job?.id,
        employee_id: user.id,
        proposal,
        bid_amount: parseFloat(bidAmount),
        status: "pending",
      });

      if (error) throw error;

      addToast({
        title: "Application submitted",
        description: "Your proposal has been sent to the client.",
        color: "success",
      });

      setProposal("");
      setBidAmount("");
    } catch (error: any) {
      console.error("Error applying to job:", error);
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center text-gray-600">
        Job not found or has been removed.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />

      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Card className="mb-6" radius="sm" shadow="sm">
          <CardHeader>
            <div className="flex justify-between w-full items-start">
              <div>
                <h1 className="text-2xl font-bold capitalize">{job.title}</h1>
                <p className="text-gray-600">{job.description}</p>
              </div>
              <div className="text-right">
                {job.budget_min !== undefined &&
                  job.budget_max !== undefined && (
                    <div className="flex items-center font-semibold text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />₱{job.budget_min} -
                      ₱{job.budget_max}
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
              {job.timeline && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {job.timeline}
                </div>
              )}
              {job.client?.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-1" />
                  {job.client.location}
                </div>
              )}
            </div>

            {/* Skills (safe check) */}
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

            {/* Files (safe check) */}
            {Array.isArray(job.files) && job.files.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <ul className="list-disc ml-6">
                  {job.files.map((file: any, index: number) => {
                    let parsed;

                    try {
                      parsed = JSON.parse(file);
                    } catch {
                      return null;
                    }

                    return (
                      <li key={index}>
                        <Link
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                          href={parsed.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <File className="h-4 w-4" /> {parsed.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Application Form */}
        <Card radius="sm" shadow="sm">
          <CardHeader>
            <h2 className="text-xl font-semibold">Apply for this Job</h2>
          </CardHeader>
          <CardBody>
            <Textarea
              className="mb-4"
              label="Proposal"
              minRows={5}
              placeholder="Write your proposal..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
            />
            <Input
              className="mb-4"
              label="Bid Amount (₱)"
              placeholder="Enter your bid"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <Button className="bg-blue-600 text-white" onClick={handleApply}>
              Submit Proposal
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
