import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { PaymentView } from "./payment-view";
import { buildPromptPayQR, PROMPTPAY_DEMO } from "@/lib/promptpay";

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; orderNo: string }>;
  searchParams: Promise<{ method?: string }>;
}) {
  const { slug, orderNo } = await params;
  const { method } = await searchParams;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true, slug: true, promptpayPhone: true, promptpayName: true },
  });
  if (!tenant) notFound();

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: { items: true },
  });
  if (!order) notFound();

  // ใช้เบอร์ PromptPay ของร้านจาก settings (ถ้าไม่ตั้ง จะใช้ค่า demo ไปก่อน)
  const promptPayAccount = tenant.promptpayPhone || PROMPTPAY_DEMO.phone;
  const promptPayDisplay = tenant.promptpayName || tenant.name;

  // สร้าง QR อัตโนมัติจากเบอร์ + ยอดเงิน
  const qrPayload = buildPromptPayQR(promptPayAccount, Number(order.total));
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=2&data=${encodeURIComponent(qrPayload)}`;

  return (
    <PaymentView
      shopName={tenant.name}
      shopSlug={tenant.slug}
      orderNo={order.orderNo}
      tableNo={order.tableNo}
      total={Number(order.total)}
      items={order.items.map((i) => ({
        productName: i.productName,
        qty: i.qty,
        price: Number(i.price),
      }))}
      promptPayQrUrl={qrImageUrl}
      initialMethod={method ?? "promptpay"}
      promptPayPhone={promptPayAccount}
      promptPayName={promptPayDisplay}
    />
  );
}
