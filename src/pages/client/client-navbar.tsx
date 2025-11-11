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
  NavbarMenuToggle, // Imported for mobile menu
  NavbarMenu, // Imported for mobile menu
  addToast,
} from "@heroui/react";
import { Briefcase } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase.ts";

// Define the navigation items for easy mapping
const navItems = [
  { name: "Dashboard", href: "/client/dashboard" },
  { name: "My Jobs", href: "/client/jobs" },
  { name: "Proposals", href: "/client/proposals" },
  { name: "Contracts", href: "/client/contracts" },
  { name: "Messages", href: "/messages" },
];

export default function ClientNavbar() {
  const [user, setUser] = useState<any>(null);
  const [userDB, setUserDB] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to manage mobile menu

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
      <Navbar
        isBordered
        maxWidth="full"
        shouldHideOnScroll={true}
        onMenuOpenChange={setIsMenuOpen} // Handle mobile menu state
      >
        {/* Navbar Content - Start (Brand and Mobile Toggle) */}
        <NavbarContent justify="start">
          {/* Mobile Menu Toggle - Only visible on small screens */}
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden"
          />
          {/* Brand */}
          <NavbarBrand>
            <Briefcase className="h-8 w-8 text-blue-600" />
            <p className="font-bold text-inherit text-2xl">ManPower</p>
          </NavbarBrand>
        </NavbarContent>

        {/* Navbar Content - Center (Desktop Links) */}
        <NavbarContent className="hidden lg:flex gap-4" justify="end">
          {navItems.map((item) => (
            <NavbarItem key={item.name}>
              <Link
                className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium"
                href={item.href}
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        {/* Navbar Content - End (Profile Dropdown) */}
        <NavbarContent justify="end">
          {/* Profile Dropdown (always visible) */}
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
        </NavbarContent>

        {/* Mobile Menu - Only appears when toggled */}
        <NavbarMenu>
          {navItems.map((item, index) => (
            <NavbarItem key={`${item.name}-${index}`}>
              <Link
                className="w-full text-xl font-medium text-gray-700 hover:text-blue-600 transition-colors py-2"
                href={item.href}
                size="lg"
              >
                {item.name}
              </Link>
            </NavbarItem>
          ))}
        </NavbarMenu>
      </Navbar>
    </>
  );
}