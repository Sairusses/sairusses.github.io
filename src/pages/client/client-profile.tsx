import { Button, Input, Textarea, Avatar, addToast } from "@heroui/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import ClientNavbar from "@/pages/client/client-navbar.tsx";

export default function ClientProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // update profile state + db
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
      console.error(error);
      addToast({
        title: "Upload Error",
        description: error.message,
        color: "danger",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          email: profile.email,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          company_name: profile.company_name,
        })
        .eq("id", user.id);

      if (error) {
        addToast({
          title: "Error",
          description: error.message,
          color: "danger",
        });
      }

      addToast({
        title: "Profile Saved",
        description: "Your profile has been updated.",
        color: "success",
      });
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
        {/*  Card */}
        <Card className="px-4 py-2" radius="sm" shadow="sm">
          <CardHeader>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Personal Information
              </h1>
              <p className="text-gray-600">
                Update your profile details to help others learn more about you
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex flex-cols-2 items-center gap-6 mb-8">
              <Avatar
                isBordered
                color="primary"
                name={profile.avatar_url ? undefined : profile.full_name}
                size="lg"
                src={profile?.avatar_url || undefined}
              />
              <div className="">
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
            <div className="grid grid-cols-2 items-center justify-between gap-4">
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
                disabled={true}
                label="Email"
                labelPlacement="outside"
                placeholder="Your registered email"
                radius="sm"
                value={profile?.email || ""}
                variant="bordered"
                onChange={(e) => handleChange("email", e.target.value)}
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

            <div className="grid grid-rows gap-4 mt-4">
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
              <Input
                label="Company Name"
                labelPlacement="outside"
                placeholder="Your Company Name"
                radius="sm"
                value={profile?.company_name || ""}
                variant="bordered"
                onChange={(e) => handleChange("company_name", e.target.value)}
              />
            </div>
            <div className="flex w-full justify-center items-center mt-4">
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
