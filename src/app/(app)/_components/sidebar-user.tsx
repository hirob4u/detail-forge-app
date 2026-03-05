import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SidebarUserClient from "./sidebar-user-client";

export default async function SidebarUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  return (
    <SidebarUserClient
      name={session.user.name ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
