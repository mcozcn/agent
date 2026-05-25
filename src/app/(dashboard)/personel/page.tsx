import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { PersonelClient } from "./personel-client";

export default async function PersonelPage() {
  const session = await auth();
  if (!session?.user) return null;
  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") redirect("/dashboard");

  const [employees, companies] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        company: { select: { shortCode: true, name: true } },
        _count: { select: { assignments: { where: { isActive: true } } } },
      },
    }),
    prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  return (
    <>
      <Header title="Personel" />
      <div className="flex-1 overflow-auto p-6">
        <PersonelClient
          initialEmployees={employees.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            activeAssignmentCount: e._count.assignments,
          }))}
          companies={companies}
        />
      </div>
    </>
  );
}
