import { getSalesReport } from "./actions";
import { toCSV } from "@/lib/csv";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, TrendingUp, ShoppingBag, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/server-i18n";

function fmt(n: number): string {
  return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const from = params.from ?? monthAgo.toISOString().slice(0, 10);
  const to = params.to ?? today;

  const report = await getSalesReport({ from, to });
  const csv = toCSV([
    ...report.byDay.map((d) => ({
      type: "daily",
      date: d.date,
      orders: d.orders,
      total: d.total.toFixed(2),
    })),
    ...report.topProducts.map((p) => ({
      type: "product",
      name: p.name,
      quantity: p.qty,
      total: p.total.toFixed(2),
    })),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">รายงาน</h1>
        <p className="text-sm text-muted-foreground">
          ภาพรวมยอดขายและสินค้า
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-xs text-muted-foreground">จากวันที่</label>
          <Input
            type="date"
            name="from"
            defaultValue={from}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">ถึงวันที่</label>
          <Input type="date" name="to" defaultValue={to} className="w-40" />
        </div>
        <Button type="submit">ดูรายงาน</Button>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
          download={`report-${from}-${to}.csv`}
        >
          <Button type="button" variant="outline">
            <Download className="mr-2 h-4 w-4" /> ส่งออก CSV
          </Button>
        </a>
      </form>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">ยอดขายรวม</div>
          <div className="mt-1 text-2xl font-bold text-primary">
            {fmt(report.totalSales)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">จำนวนออเดอร์</div>
          <div className="mt-1 flex items-baseline gap-2 text-2xl font-bold">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            {report.totalOrders}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">ออเดอร์เฉลี่ย</div>
          <div className="mt-1 text-2xl font-bold">{fmt(report.avgOrderValue)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">สินค้าใกล้หมด</div>
          <div className="mt-1 flex items-baseline gap-2 text-2xl font-bold text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {report.lowStock.length}
          </div>
        </Card>
      </div>

      {/* Payment methods */}
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">แยกตามวิธีชำระเงิน</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <div className="text-xs text-muted-foreground">เงินสด</div>
            <div className="text-lg font-semibold">{fmt(report.cashTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">บัตรเครดิต</div>
            <div className="text-lg font-semibold">{fmt(report.cardTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">โอนเงิน</div>
            <div className="text-lg font-semibold">{fmt(report.transferTotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">พร้อมเพย์</div>
            <div className="text-lg font-semibold">{fmt(report.promptpayTotal)}</div>
          </div>
        </div>
      </Card>

      {/* Daily chart */}
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <TrendingUp className="h-4 w-4" /> ยอดขายรายวัน
        </h3>
        {report.byDay.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            ไม่มีข้อมูลในช่วงนี้
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              const max = Math.max(...report.byDay.map((d) => d.total), 1);
              return report.byDay.map((d) => (
                <div key={d.date} className="flex items-center gap-3 text-sm">
                  <div className="w-24 shrink-0 text-xs text-muted-foreground">
                    {formatDate(d.date)}
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-6 rounded bg-primary/80"
                      style={{ width: `${(d.total / max) * 100}%` }}
                    />
                  </div>
                  <div className="w-28 shrink-0 text-right font-medium">{fmt(d.total)}</div>
                  <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {d.orders} ออเดอร์
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </Card>

      {/* Top products */}
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">สินค้าขายดี Top 20</h3>
        {report.topProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            ไม่มีข้อมูล
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2">#</th>
                <th className="pb-2">สินค้า</th>
                <th className="pb-2 text-right">จำนวน</th>
                <th className="pb-2 text-right">ยอดขาย</th>
              </tr>
            </thead>
            <tbody>
              {report.topProducts.map((p, i) => (
                <tr key={p.productId} className="border-b last:border-0">
                  <td className="py-1.5 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="py-1.5">{p.name}</td>
                  <td className="py-1.5 text-right">{p.qty}</td>
                  <td className="py-1.5 text-right font-medium">{fmt(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Categories + Low stock */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">ยอดขายตามหมวดหมู่</h3>
          {report.byCategory.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              ไม่มีข้อมูล
            </div>
          ) : (
            <div className="space-y-2">
              {report.byCategory.slice(0, 10).map((c) => {
                const max = Math.max(...report.byCategory.map((x) => x.total), 1);
                return (
                  <div key={c.categoryId} className="flex items-center gap-2 text-sm">
                    <div className="w-32 shrink-0 truncate">{c.categoryName}</div>
                    <div className="flex-1">
                      <div
                        className="h-5 rounded bg-primary/70"
                        style={{ width: `${(c.total / max) * 100}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-xs">{c.orders} ออ.</div>
                    <div className="w-24 text-right font-medium">{fmt(c.total)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" /> สินค้าใกล้หมด
          </h3>
          {report.lowStock.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              สต็อกทุกอย่างปกติ 🎉
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2">สินค้า</th>
                  <th className="pb-2 text-right">คงเหลือ</th>
                  <th className="pb-2 text-right">เกณฑ์</th>
                </tr>
              </thead>
              <tbody>
                {report.lowStock.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5 text-right font-medium text-destructive">
                      {p.stock}
                    </td>
                    <td className="py-1.5 text-right text-xs text-muted-foreground">
                      ≤ {p.threshold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
