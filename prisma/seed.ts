import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@resolveit.com" },
    update: {},
    create: {
      email: "admin@resolveit.com",
      name: "Sistem Yöneticisi",
      password: adminPassword,
      role: "ADMIN",
      department: "IT",
    },
  });

  // Create IT staff users
  const staffPassword = await bcrypt.hash("Staff123!", 12);
  const staff1 = await prisma.user.upsert({
    where: { email: "ahmet.it@resolveit.com" },
    update: {},
    create: {
      email: "ahmet.it@resolveit.com",
      name: "Ahmet Yılmaz",
      password: staffPassword,
      role: "IT_STAFF",
      department: "IT",
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "fatma.it@resolveit.com" },
    update: {},
    create: {
      email: "fatma.it@resolveit.com",
      name: "Fatma Kaya",
      password: staffPassword,
      role: "IT_STAFF",
      department: "IT",
    },
  });

  // Create requester users
  const userPassword = await bcrypt.hash("User123!", 12);
  const requester1 = await prisma.user.upsert({
    where: { email: "mehmet@resolveit.com" },
    update: {},
    create: {
      email: "mehmet@resolveit.com",
      name: "Mehmet Demir",
      password: userPassword,
      role: "REQUESTER",
      department: "Muhasebe",
    },
  });

  const requester2 = await prisma.user.upsert({
    where: { email: "ayse@resolveit.com" },
    update: {},
    create: {
      email: "ayse@resolveit.com",
      name: "Ayşe Çelik",
      password: userPassword,
      role: "REQUESTER",
      department: "İnsan Kaynakları",
    },
  });

  // SLA Config
  await prisma.sLAConfig.upsert({
    where: { priority: "LOW" },
    update: {},
    create: { priority: "LOW", responseHours: 24, resolutionHours: 72 },
  });
  await prisma.sLAConfig.upsert({
    where: { priority: "MEDIUM" },
    update: {},
    create: { priority: "MEDIUM", responseHours: 8, resolutionHours: 24 },
  });
  await prisma.sLAConfig.upsert({
    where: { priority: "HIGH" },
    update: {},
    create: { priority: "HIGH", responseHours: 4, resolutionHours: 8 },
  });
  await prisma.sLAConfig.upsert({
    where: { priority: "CRITICAL" },
    update: {},
    create: { priority: "CRITICAL", responseHours: 1, resolutionHours: 4 },
  });

  // Create sample tickets (idempotent)
  const ticket1 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-0001" },
    update: {},
    create: {
      ticketNumber: "TKT-0001",
      title: "Bilgisayar açılmıyor",
      description: "Sabahtan beri bilgisayarım açılmıyor, güç tuşuna bastığımda hiçbir şey olmuyor.",
      status: "RESOLVED",
      priority: "HIGH",
      category: "Donanım",
      requesterId: requester1.id,
      assignedToId: staff1.id,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      slaDeadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-0002" },
    update: {},
    create: {
      ticketNumber: "TKT-0002",
      title: "Internet bağlantısı yok",
      description: "Ofis bilgisayarımda internet bağlantısı çalışmıyor.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      category: "Ağ",
      requesterId: requester2.id,
      assignedToId: staff2.id,
      slaDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000),
    },
  });

  const ticket3 = await prisma.ticket.upsert({
    where: { ticketNumber: "TKT-0003" },
    update: {},
    create: {
      ticketNumber: "TKT-0003",
      title: "Yazıcı kağıt sıkışması",
      description: "3. kattaki yazıcıda kağıt sıkışması var.",
      status: "OPEN",
      priority: "LOW",
      category: "Donanım",
      requesterId: requester1.id,
      slaDeadline: new Date(Date.now() + 20 * 60 * 60 * 1000),
    },
  });

  // Sample assets (idempotent)
  const asset1 = await prisma.asset.upsert({
    where: { assetCode: "DMB-0001" },
    update: {},
    create: {
      assetCode: "DMB-0001",
      name: "Dell Latitude 5520",
      category: "LAPTOP",
      brand: "Dell",
      model: "Latitude 5520",
      serialNumber: "CN-0ABC123",
      purchaseDate: new Date("2023-01-15"),
      purchasePrice: 25000,
      warrantyExpiry: new Date("2026-01-15"),
      status: "ASSIGNED",
      location: "3. Kat - Muhasebe",
    },
  });

  await prisma.assetAssignment.upsert({
    where: {
      id: (await prisma.assetAssignment.findFirst({
        where: { assetId: asset1.id, userId: requester1.id },
      }))?.id ?? "non-existent",
    },
    update: {},
    create: {
      assetId: asset1.id,
      userId: requester1.id,
      notes: "Normal kullanım için zimmetlendi",
      isActive: true,
    },
  });

  const asset2 = await prisma.asset.upsert({
    where: { assetCode: "DMB-0002" },
    update: {},
    create: {
      assetCode: "DMB-0002",
      name: "HP LaserJet Pro M404",
      category: "PRINTER",
      brand: "HP",
      model: "LaserJet Pro M404",
      serialNumber: "VNB3Q12345",
      purchaseDate: new Date("2022-06-01"),
      purchasePrice: 8000,
      warrantyExpiry: new Date("2024-06-01"),
      status: "IN_SERVICE",
      location: "3. Kat",
    },
  });

  const existingService = await prisma.assetService.findFirst({
    where: { assetId: asset2.id, type: "REPAIR" },
  });
  if (!existingService) {
    await prisma.assetService.create({
      data: {
        assetId: asset2.id,
        type: "REPAIR",
        description: "Kağıt sıkışma sorunu, besleme mekanizması bakımı",
        cost: 500,
        vendor: "HP Servis",
        status: "IN_PROGRESS",
      },
    });
  }

  console.log("Seed data created successfully!");
  console.log("Admin: admin@resolveit.com / Admin123!");
  console.log("IT Staff: ahmet.it@resolveit.com / Staff123!");
  console.log("IT Staff: fatma.it@resolveit.com / Staff123!");
  console.log("Requester: mehmet@resolveit.com / User123!");
  console.log("Requester: ayse@resolveit.com / User123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
