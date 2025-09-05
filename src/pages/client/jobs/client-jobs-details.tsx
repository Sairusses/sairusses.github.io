import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { addToast, Button, Chip, Link } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar";

export default function ClientJobDetailsPage() {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<any[]>([]);
  const supabase = getSupabaseClient();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const jobId = searchParams.get("id");

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
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
          color: "danger",
        });
      }
      if (Array.isArray(data.files)) {
        const parsedFiles = data.files
          .map((f: string) => {
            try {
              return JSON.parse(f);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        setFiles(parsedFiles);
      } else {
        setFiles([]);
      }
      setJob(data);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "primary";
      case "in_progress":
        return "secondary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Link href="/client/jobs">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Link href="/client/jobs">
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

        <Card className="p-4" radius="sm" shadow="sm">
          <CardHeader>
            <div className="flex justify-between w-full items-center">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <Chip color={getStatusColor(job.status)}>{job.status}</Chip>
            </div>
          </CardHeader>

          <CardBody>
            <p className="text-gray-700 mb-4">{job.description}</p>

            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div>
                <strong>Category:</strong> {job.category}
              </div>
              <div>
                <strong>Timeline:</strong> {job.timeline}
              </div>
              {job.budget_min && job.budget_max && (
                <div>
                  <strong>Budget:</strong> ₱{job.budget_min} - ₱{job.budget_max}
                </div>
              )}
              <div>
                <strong>Posted:</strong>{" "}
                {new Date(job.created_at).toLocaleDateString()}
              </div>
            </div>

            {job.required_skills?.length > 0 && (
              <div className="mt-4">
                <strong>Required Skills:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.required_skills.map((skill: string, i: number) => (
                    <Chip key={i}>{skill}</Chip>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-4">
                <strong>Attachments:</strong>
                <ul className="list-disc ml-5 mt-2">
                  {files.map((file: any, i: number) => (
                    <li key={i}>
                      <a
                        className="text-blue-600 hover:underline"
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
