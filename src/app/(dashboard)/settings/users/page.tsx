import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { UsersClient } from "./users-client";

export default async function UsersSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, department: true, phone: true, isActive: true, permissions: true, createdAt: true, companyId: true },
    }),
    prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  return (
    <>
      <Header
          title="Kullanıcı Yönetimi"
          breadcrumbs={[
            { label: "Ayarlar", href: "/settings" },
            { label: "Kullanıcı Yönetimi" },
          ]}
        />
      <div className="flex-1 overflow-auto p-6">
        <UsersClient
          users={users.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), role: u.role as string }))}
          currentUserId={session.user.id as string}
          companies={companies}
        />
      </div>
    </>
  );
}
