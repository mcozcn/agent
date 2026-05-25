import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { CariClient } from "./cari-client";

export default async function PersonelCariPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") redirect("/dashboard");

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { company: { select: { shortCode: true, name: true } } },
  });
  if (!employee) notFound();

  // employee is guaranteed non-null after notFound() — using non-null assertion per project convention
  const emp = employee!;

  const assignments = await prisma.assetAssignment.findMany({
    where: { employeeId: id },
    orderBy: { assignedAt: "desc" },
    include: {
      asset: {
        select: { id: true, assetCode: true, name: true, category: true },
      },
    },
  });

  const assignedAssetIds = [...new Set(assignments.map((a) => a.assetId))];
  const allServices =
    assignedAssetIds.length > 0
      ? await prisma.assetService.findMany({
          where: { assetId: { in: assignedAssetIds } },
          include: {
            asset: { select: { assetCode: true, name: true, category: true } },
          },
          orderBy: { startDate: "desc" },
        })
      : [];

  const employeeServices = allServices.filter((service) =>
    assignments.some(
      (a) =>
        a.assetId === service.assetId &&
        service.startDate >= a.assignedAt &&
        service.startDate <= (a.returnedAt ?? new Date())
    )
  );

  const tickets = await prisma.ticket.findMany({
    where: {
      emailFrom: { contains: emp.email, mode: "insensitive" },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      status: true,
      priority: true,
      createdAt: true,
    },
  });

  return (
    <>
      <Header
        title={`${emp.lastName}, ${emp.firstName}`}
        breadcrumbs={[
          { label: "Personel", href: "/personel" },
          { label: `${emp.lastName}, ${emp.firstName}` },
        ]}
      />
      <div className="flex-1 overflow-auto p-6">
        <CariClient
          employee={{
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone ?? null,
            department: emp.department ?? null,
            title: emp.title ?? null,
            isActive: emp.isActive,
            company: emp.company,
          }}
          assignments={assignments.map((a) => ({
            id: a.id,
            assetId: a.assetId,
            isActive: a.isActive,
            assignedAt: a.assignedAt.toISOString(),
            returnedAt: a.returnedAt?.toISOString() ?? null,
            notes: a.notes ?? null,
            asset: a.asset,
          }))}
          services={employeeServices.map((s) => ({
            id: s.id,
            assetId: s.assetId,
            type: s.type,
            description: s.description,
            cost: s.cost?.toString() ?? null,
            vendor: s.vendor ?? null,
            startDate: s.startDate.toISOString(),
            endDate: s.endDate?.toISOString() ?? null,
            status: s.status,
            asset: s.asset,
          }))}
          tickets={tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            title: t.title,
            status: t.status,
            priority: t.priority,
            createdAt: t.createdAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
