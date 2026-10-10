import { notFound } from "next/navigation";
import { getSale } from "../actions";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/server-i18n";
import { BackButton } from "@/components/back-button";
import { PrintButton } from "./print-button";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  return (
    <div className="space-y-4 p-6">
      <BackButton href="/app/sales" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ใบเสร็จ {sale.receiptNo}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(sale.createdAt)}
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">ลูกค้า</div>
          <div className="font-medium">{sale.customer?.name ?? "ลูกค้าทั่วไป"}</div>
          {sale.customer?.phone && (
            <div className="text-sm text-muted-foreground">{sale.customer.phone}</div>
          )}
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">พนักงาน</div>
          <div className="font-medium">{sale.user?.name ?? sale.user?.email}</div>
        </Card>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left font-medium">สินค้า</th>
              <th className="px-4 py-2 text-right font-medium">ราคา</th>
              <th className="px-4 py-2 text-right font-medium">จำนวน</th>
              <th className="px-4 py-2 text-right font-medium">รวม</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((it) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium">{it.productName}</div>
                  {it.sku && (
                    <div className="text-xs text-muted-foreground">SKU: {it.sku}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  ฿{it.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 text-right">{it.quantity}</td>
                <td className="px-4 py-2 text-right font-medium">
                  ฿{it.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/30">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right">
                ยอดรวม
              </td>
              <td className="px-4 py-2 text-right">
                ฿{sale.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
            {sale.discount > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right text-destructive">
                  ส่วนลด
                </td>
                <td className="px-4 py-2 text-right text-destructive">
                  -฿{sale.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            {sale.tax > 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-2 text-right">
                  ภาษี
                </td>
                <td className="px-4 py-2 text-right">
                  ฿{sale.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="px-4 py-2 text-right text-lg font-bold">
                รวมทั้งสิ้น
              </td>
              <td className="px-4 py-2 text-right text-lg font-bold text-primary">
                ฿{sale.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 font-semibold">การชำระเงิน</h3>
        <div className="space-y-1 text-sm">
          {sale.payments.map((p) => (
            <div key={p.id} className="flex justify-between">
              <span>
                {p.method === "CASH"
                  ? "เงินสด"
                  : p.method === "CARD"
                    ? "บัตรเครดิต"
                    : p.method === "TRANSFER"
                      ? "โอนเงิน"
                      : p.method === "PROMPTPAY"
                        ? "พร้อมเพย์"
                        : p.method}
                {p.reference && ` (${p.reference})`}
              </span>
              <span>
                ฿{p.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1 font-medium">
            <span>รับเงิน</span>
            <span>฿{sale.paid.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
          </div>
          {sale.change > 0 && (
            <div className="flex justify-between text-green-600">
              <span>เงินทอน</span>
              <span>฿{sale.change.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
