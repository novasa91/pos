import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CustomerMenu } from "./customer-menu";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table: initialTable } = await searchParams;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      products: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
      categories: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!tenant) notFound();

  // Map products with category name
  const products = tenant.products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    categoryName: tenant.categories.find((c) => c.id === p.categoryId)?.name ?? "",
    trackStock: p.trackStock,
    stock: p.stock,
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>}>
      <CustomerMenu
        shopName={tenant.name}
        products={products}
        categories={tenant.categories.map((c) => ({ id: c.id, name: c.name }))}
        initialTable={initialTable || ""}
      />
    </Suspense>
  );
}
