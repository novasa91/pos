// LINE Notify helper — ส่งข้อความแจ้งเตือนไปยัง LINE ของร้าน
// https://notify-bot.line.me/doc/en/

export type LineOrderItem = {
  productName: string;
  qty: number;
  price: number;
};

export type LineOrderPayload = {
  orderNo: string;
  tableNo: string | null;
  total: number;
  items: LineOrderItem[];
  shopName: string;
  orderUrl?: string;
};

export async function sendLineNotify(
  token: string,
  message: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch("https://notify-api.line.me/api/notify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ message }).toString(),
    });
    const data = (await res.json().catch(() => ({}))) as { status?: number; message?: string };
    if (res.ok && data.status === 200) {
      return { success: true, status: 200 };
    }
    return { success: false, status: res.status, error: data.message || "LINE Notify failed" };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export function buildOrderMessage(payload: LineOrderPayload): string {
  const lines: string[] = [];
  lines.push(`🔔 ออเดอร์ใหม่ #${payload.orderNo}`);
  lines.push(`🏪 ${payload.shopName}`);
  if (payload.tableNo) lines.push(`🪑 โต๊ะ ${payload.tableNo}`);
  lines.push("");
  lines.push("📋 รายการ");
  for (const it of payload.items) {
    lines.push(`  • ${it.productName} ×${it.qty}  ฿${(it.price * it.qty).toLocaleString()}`);
  }
  lines.push("");
  lines.push(`💰 รวม ฿${payload.total.toLocaleString()}`);
  if (payload.orderUrl) {
    lines.push(`🔗 ${payload.orderUrl}`);
  }
  return lines.join("\n");
}
