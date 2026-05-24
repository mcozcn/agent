import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { CompaniesClient } from "./companies-client";

export default async function CompaniesSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true, tickets: true } } },
  });

  return (
    <>
      <Header
        title="Firma Yönetimi"
        breadcrumbs={[
          { label: "Ayarlar", href: "/settings" },
          { label: "Firma Yönetimi" },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <CompaniesClient
          initialCompanies={companies.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            userCount: c._count.users,
            ticketCount: c._count.tickets,
          }))}
        />
      </div>
    </>
  );
}
