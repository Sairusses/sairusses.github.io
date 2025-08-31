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
} from "@heroui/react";
import { Briefcase } from "lucide-react";

import { supabase } from "@/lib/supabase.ts";

export default function ClientNavbar() {
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
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium"
              href={"/"}
            >
              Dashboard
            </Link>
          </NavbarItem>
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/"}
            >
              My Jobs
            </Link>
          </NavbarItem>
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/"}
            >
              Proposals
            </Link>
          </NavbarItem>
          <NavbarItem className="hidden lg:flex">
            <Link
              className="text-gray-700 hover:text-blue-600 transition-colors text-lg font-medium pl-5"
              href={"/"}
            >
              Messages
            </Link>
          </NavbarItem>
          <span />
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name=""
                size="sm"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">example@example.com</p>
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
