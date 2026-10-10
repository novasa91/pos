// Generate receipt numbers in format: YYYYMMDD-XXXX
import { prisma } from "@/lib/db";

export async function generateReceiptNo(tenantId: string): Promise<string> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const prefix = `${yyyy}${mm}${dd}`;

  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.sale.count({
    where: {
      tenantId,
      createdAt: { gte: startOfDay, lt: endOfDay },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}
