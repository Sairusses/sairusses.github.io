import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input, Button, Select, SelectItem, Textarea } from "@heroui/react";
import { addToast } from "@heroui/toast";

import { getSupabaseClient } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar.tsx";

export default function EditJobPage() {
  const { id } = useParams(); // job id from route
  const navigate = useNavigate();
  const supabase = getSupabaseClient();

  // @ts-ignore
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // fetch job
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

      if (error) throw error;

      setJob(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setCategory(data.category || "");
      setStatus(data.status || "open");
      setBudgetMin(data.budget_min || "");
      setBudgetMax(data.budget_max || "");
    } catch (error: any) {
      addToast({
        title: "Error loading job",
        description: error.message,
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title,
          description,
          category,
          status,
          budget_min: budgetMin,
          budget_max: budgetMax,
        })
        .eq("id", id);

      if (error) throw error;

      addToast({
        title: "Job updated",
        description: "Your job has been successfully updated.",
        color: "success",
      });

      navigate(`/client/jobs/details?id=${id}`);
    } catch (error: any) {
      addToast({
        title: "Error updating job",
        description: error.message,
        color: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Job</h1>

        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Enter job title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Description"
            placeholder="Enter job description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            label="Category"
            placeholder="Enter category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Select
            label="Status"
            selectedKeys={[status]}
            onSelectionChange={(keys) =>
              setStatus(Array.from(keys)[0] as string)
            }
          >
            <SelectItem key="open">Open</SelectItem>
            <SelectItem key="in_progress">In Progress</SelectItem>
            <SelectItem key="completed">Completed</SelectItem>
            <SelectItem key="cancelled">Cancelled</SelectItem>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Budget Min"
              type="number"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
            />
            <Input
              label="Budget Max"
              type="number"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>

          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleUpdate}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
