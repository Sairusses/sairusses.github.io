import type { Job } from "@/lib/types";

import { useEffect, useState } from "react";
import { Button, Chip, Input, Textarea, addToast, Link } from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Clock, Filter, File, ArrowLeft } from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";

import { getSupabaseClient } from "@/lib/supabase";
import EmployeeNavbar from "@/pages/employee/employee-navbar";

export default function EmployeeJobDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");

  const supabase = getSupabaseClient();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal form states
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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
    if (!coverLetter || !proposedRate || !estimatedDuration) {
      addToast({
        title: "Missing fields",
        description: "Please fill out all required fields.",
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

      // --- Upload attachments only now ---
      const uploadedFiles: string[] = [];

      for (const file of attachments) {
        const filePath = `proposals_attachments/${user.id}-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("uploads")
          .upload(filePath, file);

        if (uploadError) {
          addToast({
            title: "Error uploading file",
            description: uploadError.message,
          });
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("uploads").getPublicUrl(filePath);

        uploadedFiles.push(JSON.stringify({ name: file.name, url: publicUrl }));
      }

      const { error } = await supabase.from("proposals").insert({
        job_id: job?.id,
        employee_id: user.id,
        cover_letter: coverLetter,
        proposed_rate: parseFloat(proposedRate),
        estimated_duration: estimatedDuration,
        status: "pending",
        attachments: uploadedFiles,
      });

      if (error) {
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
      }

      addToast({
        title: "Application submitted",
        description: "Your proposal has been sent to the client.",
        color: "success",
      });
      navigate("/employee/jobs");
    } catch (error: any) {
      throw error;
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

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link href="/employee/jobs">
          <Button
            className="mb-4"
            color="primary"
            href="/client/jobs"
            startContent={<ArrowLeft className="h-4 w-4" />}
            variant="solid"
          >
            Back to Jobs
          </Button>
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details */}
          <div className="lg:col-span-2">
            <Card radius="sm" shadow="sm">
              <CardHeader>
                <div className="flex justify-between w-full items-start">
                  <div>
                    <h1 className="text-2xl font-bold capitalize">
                      {job.title}
                    </h1>
                    <p className="text-gray-600">{job.description}</p>
                  </div>
                  <div className="text-right">
                    {job.budget_min !== undefined &&
                      job.budget_max !== undefined && (
                        <div className="flex items-center font-semibold">
                          ₱{job.budget_min} - ₱{job.budget_max}
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
                  <div className="text-sm text-gray-500 capitalize">
                    Status: {job.status}
                  </div>
                </div>

                {/* Skills */}
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

                {/* Files */}
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
          </div>

          {/* Proposal Form */}
          <div className="lg:col-span-1">
            <Card radius="sm" shadow="sm">
              <CardHeader>
                <h2 className="text-xl font-semibold">Submit a Proposal</h2>
              </CardHeader>
              <CardBody>
                <Textarea
                  className="mb-4"
                  label="Cover Letter"
                  labelPlacement="outside"
                  minRows={5}
                  placeholder="Introduce yourself and explain why you're a good fit..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
                <Input
                  className="mb-4"
                  label="Proposed Rate (₱)"
                  labelPlacement="outside"
                  placeholder="Enter your rate"
                  type="number"
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                />
                <Input
                  className="mb-4"
                  label="Estimated Duration"
                  labelPlacement="outside"
                  placeholder="e.g. 2 weeks, 1 month"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                />

                {/* Attachments */}
                <div className="mb-4 w-full">
                  <label
                    className="justify-center items-center cursor-pointer px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm hover:bg-gray-200"
                    htmlFor="attachments"
                  >
                    + Add Attachment
                  </label>
                  <input
                    multiple
                    className="hidden"
                    id="attachments"
                    type="file"
                    onChange={(e) => {
                      const files = e.target.files
                        ? Array.from(e.target.files)
                        : [];

                      if (files.length > 0) {
                        setAttachments((prev) => [...prev, ...files]);
                      }
                    }}
                  />

                  {/* Show selected files */}
                  <ul className="mt-2 space-y-2">
                    {attachments.map((file, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md text-sm border border-gray-300"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          type="button"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  className="bg-blue-600 text-white w-full"
                  onClick={handleApply}
                >
                  Submit Proposal
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
