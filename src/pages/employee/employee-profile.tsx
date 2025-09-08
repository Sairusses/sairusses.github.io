import { Button, Input, Textarea, Avatar, addToast, Chip } from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar.tsx";

export default function EmployeeProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      setUser(authData.user);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (error) {
        addToast({
          title: "Error",
          description: "Failed to fetch profile.",
          color: "danger",
        });
      }
      setProfile(data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  // ---------- Avatar Upload ----------
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];

      if (!file) return;

      const ext = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${ext}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        addToast({
          title: "Error uploading file",
          description: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));

      await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      addToast({
        title: "Success",
        description: "Avatar updated successfully!",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Upload Error",
        description: error.message,
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  // ---------- Resume Upload ----------
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setResumeUploading(true);
      const file = e.target.files?.[0];

      if (!file) return;

      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        addToast({
          title: "Invalid File",
          description: "Only PDF, DOC, DOCX files are allowed.",
          color: "danger",
        });

        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        addToast({
          title: "File Too Large",
          description: "Max file size is 5MB.",
          color: "danger",
        });

        return;
      }

      const ext = file.name.split(".").pop();
      const fileName = `${file.name}-${Date.now()}.${ext}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        addToast({
          title: "Error uploading file",
          description: uploadError.message,
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      const resumeUrl = publicUrlData.publicUrl;

      setProfile((prev: any) => ({ ...prev, resume_url: resumeUrl }));

      await supabase
        .from("users")
        .update({ resume_url: resumeUrl })
        .eq("id", user.id);

      addToast({
        title: "Success",
        description: "Resume uploaded successfully!",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Upload Error",
        description: error.message,
        color: "danger",
      });
    } finally {
      setResumeUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    try {
      await supabase
        .from("users")
        .update({ resume_url: null })
        .eq("id", user.id);
      setProfile((prev: any) => ({ ...prev, resume_url: null }));
      addToast({
        title: "Removed",
        description: "Resume removed successfully.",
        color: "success",
      });
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    }
  };

  // ---------- Skills ----------
  const addSkill = () => {
    if (!newSkill.trim()) return;
    const updatedSkills = [...(profile.skills || []), newSkill.trim()];

    setProfile((prev: any) => ({ ...prev, skills: updatedSkills }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = profile.skills.filter((s: string) => s !== skill);

    setProfile((prev: any) => ({ ...prev, skills: updatedSkills }));
  };

  // ---------- Save ----------
  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          skills: profile.skills,
        })
        .eq("id", user.id);

      if (error) {
        addToast({
          title: "Error uploading file",
          description: error.message,
        });
      }

      addToast({
        title: "Profile Saved",
        description: "Your profile has been updated.",
        color: "success",
      });
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavbar />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your account information and preferences
          </p>
        </div>
        <Card className="px-4 py-2" radius="sm" shadow="sm">
          <CardHeader>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Personal Information
              </h1>
              <p className="text-gray-600">Update your profile details</p>
            </div>
          </CardHeader>
          <CardBody>
            {/* Avatar Upload */}
            <div className="flex flex-cols-2 items-center gap-6 mb-8">
              <Avatar
                isBordered
                color="primary"
                name={profile.avatar_url ? undefined : profile.full_name}
                size="lg"
                src={profile?.avatar_url || undefined}
              />
              <div>
                <label
                  className="bg-white hover:bg-gray-200 border border-gray-500 py-2 px-4 text-sm rounded-lg cursor-pointer"
                  htmlFor="file-upload"
                >
                  Change Photo
                </label>
                <input
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  id="file-upload"
                  type="file"
                  onChange={handleAvatarUpload}
                />
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                labelPlacement="outside"
                placeholder="Enter your full name"
                radius="sm"
                value={profile?.full_name || ""}
                variant="bordered"
                onChange={(e) => handleChange("full_name", e.target.value)}
              />
              <Input
                disabled
                label="Email"
                labelPlacement="outside"
                placeholder="Your registered email"
                radius="sm"
                value={profile?.email || ""}
                variant="bordered"
              />
              <Input
                label="Phone"
                labelPlacement="outside"
                placeholder="Enter your phone number"
                radius="sm"
                value={profile?.phone || ""}
                variant="bordered"
                onChange={(e) => handleChange("phone", e.target.value)}
              />
              <Input
                label="Location"
                labelPlacement="outside"
                placeholder="City, Country"
                radius="sm"
                value={profile?.location || ""}
                variant="bordered"
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>

            {/* Bio & Website */}
            <div className="flex flex-col gap-4 mt-4">
              <Textarea
                label="Bio"
                labelPlacement="outside"
                placeholder="Write a short bio about yourself"
                radius="sm"
                value={profile?.bio || ""}
                variant="bordered"
                onChange={(e) => handleChange("bio", e.target.value)}
              />
              <Input
                label="Website"
                labelPlacement="outside"
                placeholder="https://yourwebsite.com"
                radius="sm"
                type="url"
                value={profile?.website || ""}
                variant="bordered"
                onChange={(e) => handleChange("website", e.target.value)}
              />
              {/* Skills */}
              <div className="">
                <h2 className="text-sm mb-2">Skills</h2>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addSkill())
                    }
                  />
                  <Button onClick={addSkill}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills?.map((skill: string, index: number) => (
                    <Chip key={index} onClose={() => removeSkill(skill)}>
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
              {/* Resume */}
              <div className="">
                <h2 className="text-lg font-semibold mb-2">Resume</h2>
                {profile?.resume_url ? (
                  <div className="flex items-center gap-2">
                    <a
                      className="text-blue-600 hover:underline"
                      href={profile.resume_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View Resume
                    </a>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      variant="light"
                      onClick={handleRemoveResume}
                    >
                      <X />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 p-6 text-center rounded-md">
                    <label
                      className="cursor-pointer text-gray-600"
                      htmlFor="resume-upload"
                    >
                      Click to upload or drag and drop <br />
                      <span className="text-sm text-gray-500">
                        .pdf, .doc, .docx • Max 5MB
                      </span>
                    </label>
                    <input
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      disabled={resumeUploading}
                      id="resume-upload"
                      type="file"
                      onChange={handleResumeUpload}
                    />
                    {resumeUploading && (
                      <p className="mt-2 text-sm text-gray-500">Uploading...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Save */}
            <div className="flex w-full justify-center items-center mt-8">
              <Button
                className="w-md bg-blue-600 text-white"
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
