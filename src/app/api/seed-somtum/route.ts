import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Unsplash Thai food images — รูปจริงจาก Unsplash CDN
const IMG = {
  // ส้มตำ / อาหารไทย
  somtum: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&q=80",
  somtum2: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400&q=80",
  // ลาบ / เนื้อ
  laap: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  laap2: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
  // ข้าวเหนียว / หมูแดง
  sticky: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
  // เครื่องเคียง
  side: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
  // น้ำปู
  namPoo: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80",
  // เครื่องดื่ม
  drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80",
  beer: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400&q=80",
  soda: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?w=400&q=80",
  water: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80",
  // ไก่ย่าง
  gaiyang: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
  // แคบหมู
  pork: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80",
  // ผักสด
  veg: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
};

export async function GET(req: NextRequest) {
  // Force dynamic - no caching
  return POST(req);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { memberships: { include: { tenant: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const tenant = user.memberships[0]?.tenant;
    if (!tenant) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    const tenantId = tenant.id;

    // Clear existing data
    await prisma.product.deleteMany({ where: { tenantId } });
    await prisma.category.deleteMany({ where: { tenantId } });

    // Create categories
    const categories = await Promise.all([
      prisma.category.create({ data: { tenantId, name: "ส้มตำ", sortOrder: 1 } }),
      prisma.category.create({ data: { tenantId, name: "ลาบ", sortOrder: 2 } }),
      prisma.category.create({ data: { tenantId, name: "ข้าวเหนียว", sortOrder: 3 } }),
      prisma.category.create({ data: { tenantId, name: "เครื่องเคียง", sortOrder: 4 } }),
      prisma.category.create({ data: { tenantId, name: "น้ำปู", sortOrder: 5 } }),
      prisma.category.create({ data: { tenantId, name: "เครื่องดื่ม", sortOrder: 6 } }),
    ]);

    const [somtumCat, laapCat, riceCat, sideCat, namPooCat, drinkCat] = categories;

    // Seed products with real food photos
    const products = await Promise.all([
      // ส้มตำ
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำไทย", sku: "ST001", price: 50, cost: 20, stock: 50, trackStock: true, isActive: true, imageUrl: IMG.somtum } }),
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำกุ้ง", sku: "ST002", price: 60, cost: 25, stock: 40, trackStock: true, isActive: true, imageUrl: IMG.somtum2 } }),
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำหมูยอ", sku: "ST003", price: 55, cost: 22, stock: 35, trackStock: true, isActive: true, imageUrl: IMG.somtum } }),
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำแห้ง", sku: "ST004", price: 50, cost: 20, stock: 45, trackStock: true, isActive: true, imageUrl: IMG.somtum2 } }),
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำซั่ว", sku: "ST005", price: 50, cost: 20, stock: 40, trackStock: true, isActive: true, imageUrl: IMG.somtum } }),
      prisma.product.create({ data: { tenantId, categoryId: somtumCat.id, name: "ส้มตำปลาร้า", sku: "ST006", price: 55, cost: 22, stock: 30, trackStock: true, isActive: true, imageUrl: IMG.somtum2 } }),

      // ลาบ
      prisma.product.create({ data: { tenantId, categoryId: laapCat.id, name: "ลาบหมู", sku: "LP001", price: 60, cost: 25, stock: 30, trackStock: true, isActive: true, imageUrl: IMG.laap } }),
      prisma.product.create({ data: { tenantId, categoryId: laapCat.id, name: "ลาบวัว", sku: "LP002", price: 70, cost: 30, stock: 20, trackStock: true, isActive: true, imageUrl: IMG.laap2 } }),
      prisma.product.create({ data: { tenantId, categoryId: laapCat.id, name: "ลาบไก่", sku: "LP003", price: 60, cost: 25, stock: 25, trackStock: true, isActive: true, imageUrl: IMG.laap } }),
      prisma.product.create({ data: { tenantId, categoryId: laapCat.id, name: "ลาบปลากระป๋อง", sku: "LP004", price: 50, cost: 20, stock: 35, trackStock: true, isActive: true, imageUrl: IMG.laap2 } }),
      prisma.product.create({ data: { tenantId, categoryId: laapCat.id, name: "ซุปหน่อไม้", sku: "LP005", price: 50, cost: 15, stock: 40, trackStock: true, isActive: true, imageUrl: IMG.veg } }),

      // ข้าวเหนียว
      prisma.product.create({ data: { tenantId, categoryId: riceCat.id, name: "ข้าวเหนียวหมูแดง", sku: "KR001", price: 50, cost: 20, stock: 40, trackStock: true, isActive: true, imageUrl: IMG.sticky } }),
      prisma.product.create({ data: { tenantId, categoryId: riceCat.id, name: "ข้าวเหนียวหมูกรอบ", sku: "KR002", price: 55, cost: 22, stock: 35, trackStock: true, isActive: true, imageUrl: IMG.sticky } }),
      prisma.product.create({ data: { tenantId, categoryId: riceCat.id, name: "ข้าวเหนียวไก่ย่าง", sku: "KR003", price: 55, cost: 22, stock: 35, trackStock: true, isActive: true, imageUrl: IMG.gaiyang } }),
      prisma.product.create({ data: { tenantId, categoryId: riceCat.id, name: "ข้าวเหนียวน้อง", sku: "KR004", price: 40, cost: 15, stock: 30, trackStock: true, isActive: true, imageUrl: IMG.sticky } }),

      // เครื่องเคียง
      prisma.product.create({ data: { tenantId, categoryId: sideCat.id, name: "ไส้อัพ", sku: "SD001", price: 20, cost: 8, stock: 60, trackStock: true, isActive: true, imageUrl: IMG.pork } }),
      prisma.product.create({ data: { tenantId, categoryId: sideCat.id, name: "ไส้กรอกอีสาน", sku: "SD002", price: 25, cost: 10, stock: 50, trackStock: true, isActive: true, imageUrl: IMG.pork } }),
      prisma.product.create({ data: { tenantId, categoryId: sideCat.id, name: "แคบหมู", sku: "SD003", price: 15, cost: 5, stock: 80, trackStock: true, isActive: true, imageUrl: IMG.pork } }),
      prisma.product.create({ data: { tenantId, categoryId: sideCat.id, name: "ผักสด", sku: "SD004", price: 10, cost: 3, stock: 100, trackStock: true, isActive: true, imageUrl: IMG.veg } }),
      prisma.product.create({ data: { tenantId, categoryId: sideCat.id, name: "น้ำพริก", sku: "SD005", price: 15, cost: 5, stock: 50, trackStock: true, isActive: true, imageUrl: IMG.side } }),

      // น้ำปู
      prisma.product.create({ data: { tenantId, categoryId: namPooCat.id, name: "น้ำปูใส่ข้าว", sku: "NP001", price: 20, cost: 6, stock: 60, trackStock: true, isActive: true, imageUrl: IMG.namPoo } }),
      prisma.product.create({ data: { tenantId, categoryId: namPooCat.id, name: "น้ำปูใส่เส้นมาม่า", sku: "NP002", price: 25, cost: 8, stock: 50, trackStock: true, isActive: true, imageUrl: IMG.namPoo } }),
      prisma.product.create({ data: { tenantId, categoryId: namPooCat.id, name: "น้ำปูปลาร้า", sku: "NP003", price: 20, cost: 6, stock: 50, trackStock: true, isActive: true, imageUrl: IMG.namPoo } }),

      // เครื่องดื่ม
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "น้ำเปล่า", sku: "DR001", price: 10, cost: 3, stock: 200, trackStock: true, isActive: true, imageUrl: IMG.water } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "น้ำลิ้นจี่", sku: "DR002", price: 20, cost: 7, stock: 80, trackStock: true, isActive: true, imageUrl: IMG.drink } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "น้ำมะตาล", sku: "DR003", price: 20, cost: 7, stock: 80, trackStock: true, isActive: true, imageUrl: IMG.drink } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "สมุนไพร", sku: "DR004", price: 20, cost: 7, stock: 60, trackStock: true, isActive: true, imageUrl: IMG.drink } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "น้ำกระเจี๊ยบ", sku: "DR005", price: 20, cost: 7, stock: 60, trackStock: true, isActive: true, imageUrl: IMG.drink } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "เบียร์ลีโอ", sku: "DR006", price: 45, cost: 18, stock: 100, trackStock: true, isActive: true, imageUrl: IMG.beer } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "เบียร์ช้าง", sku: "DR007", price: 50, cost: 20, stock: 100, trackStock: true, isActive: true, imageUrl: IMG.beer } }),
      prisma.product.create({ data: { tenantId, categoryId: drinkCat.id, name: "โซดา", sku: "DR008", price: 15, cost: 5, stock: 100, trackStock: true, isActive: true, imageUrl: IMG.soda } }),
    ]);

    return NextResponse.json({
      success: true,
      tenant: tenant.name,
      slug: tenant.slug,
      orderUrl: `/order/${tenant.slug}`,
      categories: categories.length,
      products: products.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
