"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, Printer, Wallet, Check, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import { SaleRowActions } from "./sale-row-actions";
import { formatDateTime } from "@/lib/server-i18n";

type SaleItem = { id: string; quantity: number };
type Payment = { id: string; method: string; amount: number; reference?: string | null };
type SaleRow = {
  id: string;
  receiptNo: string;
  status: string;
  total: number;
  createdAt: Date | string;
  user?: { name?: string | null; email?: string | null } | null;
  customer?: { name?: string | null } | null;
  payments?: Payment[];
  items?: SaleItem[];
};

export function SalesClient({ initialSales }: { initialSales: SaleRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = initialSales.filter((s) =>
    s.receiptNo.toLowerCase().includes(query.toLowerCase())
  );

  const STATUS_LABEL: Record<string, { th: string; class: string }> = {
    COMPLETED: { th: "สำเร็จ", class: "bg-green-100 text-green-800" },
    RETURNED: { th: "คืนแล้ว", class: "bg-red-100 text-red-800" },
    PARTIAL_RETURN: { th: "คืนบางส่วน", class: "bg-yellow-100 text-yellow-800" },
    PENDING: { th: "รอชำระ", class: "bg-amber-100 text-amber-800" },
    CANCELLED: { th: "ยกเลิก", class: "bg-gray-100 text-gray-600" },
  };

  return (
    <div className="space-y-4 p-6">
      <BackButton href="/app" />

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ประวัติการขาย</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} รายการ
            {query && ` (จาก ${initialSales.length} ทั้งหมด)`}
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขที่ใบเสร็จ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64 pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ShoppingBag className="mb-3 h-12 w-12 opacity-20" />
          <p>{query ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีรายการขาย"}</p>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">เลขที่ใบเสร็จ</th>
                <th className="px-4 py-2 text-left font-medium">วันที่</th>
                <th className="hidden px-4 py-2 text-left font-medium md:table-cell">ลูกค้า</th>
                <th className="hidden px-4 py-2 text-left font-medium md:table-cell">พนักงาน</th>
                <th className="px-4 py-2 text-right font-medium">ยอดรวม</th>
                <th className="px-4 py-2 text-center font-medium">สถานะ</th>
                <th className="px-4 py-2 text-right font-medium">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const st = STATUS_LABEL[s.status] ?? { th: s.status, class: "bg-gray-100 text-gray-600" };
                return (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2 font-mono text-xs">{s.receiptNo}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateTime(new Date(s.createdAt))}
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      {s.customer?.name ?? "—"}
                    </td>
                    <td className="hidden px-4 py-2 md:table-cell">
                      {s.user?.name ?? s.user?.email ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      ฿{s.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${st.class}`}>
                        {st.th}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/app/sales/${s.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <SaleRowActions
                          saleId={s.id}
                          status={s.status}
                          total={s.total}
                          receiptNo={s.receiptNo}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
