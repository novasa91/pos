// Seed script: creates a demo tenant with sample data
// Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // 1. Demo owner user
  const email = "demo@poscloud.test";
  const password = "demo1234";

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        hashedPassword: await bcrypt.hash(password, 10),
        name: "Demo Owner",
        phone: "0812345678",
      },
    });
    console.log(`✓ Created user: ${email} / ${password}`);
  } else {
    console.log(`✓ User exists: ${email}`);
  }

  // 2. Demo tenant
  let tenant = await prisma.tenant.findFirst({ where: { ownerId: user.id } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        slug: "demo-shop",
        name: "ร้านสาธิต POS Cloud",
        address: "123/45 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
        phone: "02-123-4567",
        email: "demo@poscloud.test",
        taxId: "0105560001234",
        currency: "THB",
        timezone: "Asia/Bangkok",
        locale: "th",
        vatEnabled: true,
        vatRate: 7,
        vatInclusive: false,
        receiptHeader: "ขอบคุณที่มาอุดหนุน",
        receiptFooter: "สินค้าซื้อแล้วไม่รับคืน กรุณาตรวจสอบก่อนชำระ",
        ownerId: user.id,
      },
    });
    console.log(`✓ Created tenant: ${tenant.name}`);
  } else {
    console.log(`✓ Tenant exists: ${tenant.name}`);
  }

  // 3. Membership
  const existing = await prisma.userOnTenant.findFirst({
    where: { userId: user.id, tenantId: tenant.id },
  });
  if (!existing) {
    await prisma.userOnTenant.create({
      data: { userId: user.id, tenantId: tenant.id, role: "OWNER" },
    });
    console.log("✓ Added OWNER membership");
  }

  // 4. Trial subscription
  const sub = await prisma.subscription.findUnique({ where: { tenantId: tenant.id } });
  if (!sub) {
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: "STANDARD",
        status: "TRIALING",
        trialEndsAt: trialEnds,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnds,
      },
    });
    console.log("✓ Created TRIALING subscription (7 days)");
  }

  // 5. Categories
  const existingCategories = await prisma.category.findMany({
    where: { tenantId: tenant.id },
  });
  if (existingCategories.length === 0) {
    await prisma.category.createMany({
      data: [
        { tenantId: tenant.id, name: "เครื่องดื่ม", color: "#3b82f6", sortOrder: 1 },
        { tenantId: tenant.id, name: "ขนมขบเคี้ยว", color: "#f59e0b", sortOrder: 2 },
        { tenantId: tenant.id, name: "อาหารสด", color: "#10b981", sortOrder: 3 },
        { tenantId: tenant.id, name: "ของใช้", color: "#8b5cf6", sortOrder: 4 },
      ],
    });
    console.log("✓ Created 4 categories");
  }

  // 6. Products
  const productCount = await prisma.product.count({ where: { tenantId: tenant.id } });
  if (productCount === 0) {
    const cats = await prisma.category.findMany({ where: { tenantId: tenant.id } });
    const catMap = new Map(cats.map((c) => [c.name, c.id]));

    const products = [
      { name: "กาแฟร้อน", sku: "DRK-001", price: 45, cost: 15, stock: 100, cat: "เครื่องดื่ม" },
      { name: "กาแฟเย็น", sku: "DRK-002", price: 55, cost: 18, stock: 100, cat: "เครื่องดื่ม" },
      { name: "ชาเขียว", sku: "DRK-003", price: 50, cost: 15, stock: 80, cat: "เครื่องดื่ม" },
      { name: "น้ำเปล่า", sku: "DRK-004", price: 15, cost: 5, stock: 200, cat: "เครื่องดื่ม" },
      { name: "ขนมปังกรอบ", sku: "SNK-001", price: 25, cost: 8, stock: 150, cat: "ขนมขบเคี้ยว" },
      { name: "มันฝรั่งทอด", sku: "SNK-002", price: 30, cost: 10, stock: 100, cat: "ขนมขบเคี้ยว" },
      { name: "แซนวิชแฮม", sku: "FDM-001", price: 65, cost: 25, stock: 30, cat: "อาหารสด" },
      { name: "สลัดผัก", sku: "FDM-002", price: 89, cost: 30, stock: 25, cat: "อาหารสด" },
      { name: "กระดาษทิชชู่", sku: "HHL-001", price: 59, cost: 25, stock: 50, cat: "ของใช้" },
      { name: "สบู่เหลว", sku: "HHL-002", price: 89, cost: 35, stock: 40, cat: "ของใช้" },
    ];
    await prisma.product.createMany({
      data: products.map((p) => ({
        tenantId: tenant.id,
        name: p.name,
        sku: p.sku,
        barcode: `88${p.sku.replace("-", "")}`,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        lowStockThreshold: 10,
        categoryId: catMap.get(p.cat) ?? null,
        isActive: true,
        trackStock: true,
      })),
    });
    console.log(`✓ Created ${products.length} products`);
  }

  // 7. Customers
  const custCount = await prisma.customer.count({ where: { tenantId: tenant.id } });
  if (custCount === 0) {
    await prisma.customer.createMany({
      data: [
        { tenantId: tenant.id, name: "สมชาย ใจดี", phone: "0811111111", email: "somchai@example.com", points: 50 },
        { tenantId: tenant.id, name: "สมหญิง รักไทย", phone: "0822222222", email: "somying@example.com", points: 120 },
        { tenantId: tenant.id, name: "John Smith", phone: "0833333333", email: "john@example.com", points: 30 },
      ],
    });
    console.log("✓ Created 3 customers");
  }

  console.log("\n✅ Seed complete!");
  console.log(`\n📧 Login: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`\n🌐 Open: http://localhost:3000/login`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
