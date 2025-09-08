import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  Avatar,
  DropdownMenu,
  DropdownItem,
  addToast,
} from "@heroui/react";
import { Briefcase } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase.ts";

export default function ClientNavbar() {
  const [user, setUser] = useState<any>(null);
  const [userDB, setUserDB] = useState<any>(null);

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
    }
  };

  const fetchUsersDB = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        addToast({
          title: "Error fetching user",
          description: error.message,
          color: "danger",
        });
      }
      if (data) {
        setUserDB(data);
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchUser().then(() => {
      if (user?.id) {
        fetchUsersDB(user.id);
      }
    });
  }, [user?.id]);
  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }

  return (
    <>
      <Navbar isBordered maxWidth="full" shouldHideOnScroll={true}>
        <NavbarContent className="hidden sm:flex gap-4" justify="start">
          <NavbarBrand>
            <Briefcase className="h-8 w-8 text-blue-600" />
            <p className="font-bold text-inherit text-2xl">ManPower</p>
          </NavbarBrand>
        </NavbarContent>
        <NavbarContent justify="end">
          {/* Dashboard */}
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium"
              href={"/client/dashboard"}
            >
              Dashboard
            </Link>
          </NavbarItem>
          {/* Jobs */}
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/client/jobs"}
            >
              My Jobs
            </Link>
          </NavbarItem>
          {/* Proposals */}
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/client/proposals"}
            >
              Proposals
            </Link>
          </NavbarItem>
          {/* Contracts */}
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/client/contracts"}
            >
              Contracts
            </Link>
          </NavbarItem>
          {/* Messages */}
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/messages"}
            >
              Messages
            </Link>
          </NavbarItem>
          <span />
          {/* Profile */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name={userDB?.full_name || ""}
                size="sm"
                src={userDB?.avatar_url || undefined}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <Link href="/client/profile">
                  <div className="grid grid-rows-2 justify-start">
                    <p className="font-normal text-gray-800 text-sm">
                      Signed in as
                    </p>
                    <p className="font-semibold text-black text-sm">
                      {userDB?.email || user?.email}
                    </p>
                  </div>
                </Link>
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                onClick={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <span />
        </NavbarContent>
      </Navbar>
    </>
  );
}
