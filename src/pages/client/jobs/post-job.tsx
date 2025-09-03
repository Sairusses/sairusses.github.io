import React, { useEffect, useState } from "react";
import {
  addToast,
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Form,
  Input,
  Link,
  NumberInput,
} from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Textarea } from "@heroui/input";
import { Plus } from "lucide-react";

import { supabase } from "@/lib/supabase.ts";
import ClientNavbar from "@/pages/client/client-navbar.tsx";
import { FileUpload } from "@/components/file-upload.tsx";
import {useNavigate} from "react-router-dom";

export default function PostJob() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState(
    new Set(["Category"]),
  );
  // @ts-ignore
  const [selectedTimeline, setSelectedTimeline] = React.useState(
    new Set(["Timeline"]),
  );
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; name: string; type: string; size: number }>
  >([]);
  const [budgetMin, setBudgetMin] = useState<number | null>(null);
  const [budgetMax, setBudgetMax] = useState<number | null>(null);
  const navigate = useNavigate();

  const selectedValueCategory = React.useMemo(
    () => Array.from(selectedCategory).join(", ").replace(/_/g, " "),
    [selectedCategory],
  );

  const selectedValueTimeline = React.useMemo(
    () => Array.from(selectedTimeline).join(", ").replace(/_/g, " "),
    [selectedTimeline],
  );

  const categories = [
    {
      key: "web_development",
      label: "Web Development",
    },
    {
      key: "mobile_development",
      label: "Mobile Development",
    },
    {
      key: "design",
      label: "Design",
    },
    {
      key: "writing",
      label: "Writing",
    },
    {
      key: "marketing",
      label: "Marketing",
    },
    {
      key: "data_science",
      label: "Data Science",
    },
    {
      key: "other",
      label: "Other",
    },
  ];

  const timelines = [
    {
      key: "asap",
      label: "ASAP",
    },
    {
      key: "1-4_weeks",
      label: "1-4 weeks",
    },
    {
      key: "1-6_months",
      label: "1-6 months",
    },
    {
      key: "6-12 months",
      label: "6-12 months",
    },
    {
      key: "1_year+",
      label: "1 year+",
    },
  ];

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

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
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          client_id: user.id,
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          category: selectedValueCategory,
          budget_min: budgetMin,
          budget_max: budgetMax,
          timeline: selectedValueTimeline,
          required_skills: skills,
          files: uploadedFiles,
          status: "open",
        })
        .select()
        .single();

      if (error) {
        addToast({
          title: "Error posting job",
          description: error.message,
          color: "danger",
        });

        return;
      }

      addToast({
        title: "Job posted successfully!",
        description: "Your job is now live and accepting proposals.",
      });

      navigate(`/client/jobs/details?id=${data.id}`);
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  // @ts-ignore
  // @ts-ignore
  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8 justify-end">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Post a New Job
          </h1>
          <p className="text-gray-600">
            Describe your project and find the perfect freelancer
          </p>
        </div>
        <Card className="p-4" radius="sm" shadow="sm">
          <CardHeader className="flex flex-col items-start justify-between">
            <div className="text-2xl font-bold">Job Details</div>
            <div className="text-sm text-gray-600">
              Provide clear information about your project requirements
            </div>
          </CardHeader>
          {/* User Input Form */}
          <CardBody>
            <Form className="space-y-2" onSubmit={onSubmit}>
              <Input
                label="Job Title *"
                labelPlacement="outside"
                name="title"
                placeholder="e.g., Build a responsive website for my business"
                radius="sm"
                type="text"
              />
              <Textarea
                label="Description *"
                labelPlacement="outside"
                minRows={5}
                name="description"
                placeholder="Describe your project in detail. Include what you need, your goals, and any specific requirements..."
                radius="sm"
                rows={15}
                type="text"
              />
              <div className="text-sm ">Category *</div>
              <Dropdown className="w-xl">
                <DropdownTrigger>
                  <Button
                    className="capitalize w-full justify-start"
                    variant="bordered"
                  >
                    {selectedValueCategory}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Category selection"
                  disallowEmptySelection={true}
                  items={categories}
                  selectedKeys={selectedCategory}
                  selectionMode="single"
                  variant="flat"
                  onSelectionChange={(keys) =>
                    setSelectedCategory(new Set(keys as Set<string>))
                  }
                >
                  {(item) => (
                    <DropdownItem key={item.key}>{item.label}</DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
              <div className="text-sm ">Timeline *</div>
              <Dropdown className="w-xl">
                <DropdownTrigger>
                  <Button
                    className="capitalize w-full justify-start"
                    variant="bordered"
                  >
                    {selectedValueTimeline}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Timeline selection"
                  disallowEmptySelection={true}
                  items={timelines}
                  selectedKeys={selectedTimeline}
                  selectionMode="single"
                  variant="flat"
                  onSelectionChange={(keys) =>
                    setSelectedTimeline(new Set(keys as Set<string>))
                  }
                >
                  {(item) => (
                    <DropdownItem key={item.key}>{item.label}</DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
              <div className="text-sm ">Required Skills *</div>
              <div className="flex gap-2 mb-2 w-full">
                <Input
                  placeholder="Add a skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
                <Button
                  color="primary"
                  type="button"
                  variant="ghost"
                  onPress={addSkill}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Chip
                    key={skill}
                    className="flex items-center gap-1"
                    radius="sm"
                    variant="bordered"
                    onClose={() => removeSkill(skill)}
                  >
                    {skill}
                  </Chip>
                ))}
              </div>
              <div className="text-sm ">Project Files (Optional)</div>
              <FileUpload
                acceptedTypes={["image/*", ".pdf", ".doc", ".docx", ".txt"]}
                className="w-full"
                maxFileSize={10}
                maxFiles={5}
                uploadType="job_attachment"
                onFilesUploaded={setUploadedFiles}
              />
              <div className="flex flex-row justify-between w-full gap-5">
                <NumberInput
                  hideStepper={true}
                  label="Budget Min (₱) *"
                  labelPlacement="outside"
                  name="budgetMin"
                  value={budgetMin ?? 0}
                  onValueChange={(val) => setBudgetMin(val ?? null)}
                  variant="bordered"
                />
                <NumberInput
                  hideStepper={true}
                  label="Budget Max (₱) *"
                  labelPlacement="outside"
                  name="budgetMax"
                  value={budgetMax ?? 0}
                  onValueChange={(val) => setBudgetMax(val ?? null)}
                  variant="bordered"
                />
              </div>
              <div className="flex gap-4 pt-6 w-full">
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                  radius="sm"
                  type="submit"
                >
                  {loading ? "Posting..." : "Post Job"}
                </Button>
                <Link href="/client/dashboard">
                  <Button radius="sm" type="button" variant="ghost">
                    Cancel
                  </Button>
                </Link>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
