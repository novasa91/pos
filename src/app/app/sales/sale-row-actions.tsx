"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, Printer, Wallet, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SaleRowActions({
  saleId,
  status,
  total,
  receiptNo,
}: {
  saleId: string;
  status: string;
  total: number;
  receiptNo: string;
}) {
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [method, setMethod] = useState("CASH");

  async function pay() {
    setPaying(true);
    try {
      const res = await fetch("/api/sales/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, method }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPay(false);
        router.refresh();
      } else if (data.alreadyPaid) {
        alert("ชำระครบแล้ว");
      } else {
        alert("Error: " + (data.error || "ไม่สำเร็จ"));
      }
    } finally {
      setPaying(false);
    }
  }

  const canPay = status !== "COMPLETED" && status !== "RETURNED" && status !== "CANCELLED";

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/app/sales/${saleId}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
        title="ดูรายละเอียด"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
      {canPay && (
        <button
          onClick={() => setShowPay(true)}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-gradient-to-r from-emerald-500 to-green-500 px-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
          title="ชำระเงิน"
        >
          <Wallet className="h-3.5 w-3.5" /> จ่าย
        </button>
      )}
      {status === "COMPLETED" && (
        <Link
          href={`/app/sales/${saleId}`}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] px-2.5 text-xs font-bold text-white shadow-sm hover:brightness-110"
          title="พิมพ์ใบเสร็จ"
        >
          <Printer className="h-3.5 w-3.5" /> ปริ้น
        </Link>
      )}

      {showPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">รับชำระเงิน</h3>
              <button
                onClick={() => setShowPay(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-4 text-center">
              <div className="text-xs text-muted-foreground">เลขที่ใบเสร็จ</div>
              <div className="font-mono text-sm">{receiptNo}</div>
              <div className="mt-2 text-xs text-muted-foreground">ยอดที่ต้องชำระ</div>
              <div className="text-3xl font-bold text-[#5b21b6]">฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
            </div>

            <div className="mb-4">
              <div className="mb-2 text-xs font-medium text-muted-foreground">ช่องทางชำระ</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "CASH", name: "เงินสด", emoji: "💵", color: "from-emerald-500 to-green-500" },
                  { id: "TRANSFER", name: "โอน", emoji: "🏦", color: "from-blue-500 to-cyan-500" },
                  { id: "PROMPTPAY", name: "PromptPay", emoji: "📱", color: "from-indigo-500 to-purple-500" },
                  { id: "CARD", name: "บัตรเครดิต", emoji: "💳", color: "from-orange-500 to-red-500" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                      method === m.id
                        ? "border-[#7c3aed] bg-[#faf5ff] shadow"
                        : "border-[#e9d5ff] hover:border-[#7c3aed]/40"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${m.color} text-base`}>
                      {m.emoji}
                    </div>
                    <span className="text-sm font-semibold">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowPay(false)}
                variant="outline"
                className="flex-1 rounded-xl"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={pay}
                disabled={paying}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
              >
                {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                ยืนยันชำระ ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
