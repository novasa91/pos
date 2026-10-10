"use client";

import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderItem = {
  productName: string;
  qty: number;
  price: number;
  note?: string | null;
};

export function PrintReceipt({
  orderNo,
  tableNo,
  items,
  shopName,
  total,
  createdAt,
  onClose,
}: {
  orderNo: string;
  tableNo: string | null;
  items: OrderItem[];
  shopName: string;
  total: number;
  createdAt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    // Auto-trigger print dialog when opened (only on first mount)
    const printed = sessionStorage.getItem(`printed-${orderNo}`);
    if (!printed) {
      const timer = setTimeout(() => {
        window.print();
        sessionStorage.setItem(`printed-${orderNo}`, "1");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  const time = new Date(createdAt).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = new Date(createdAt).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 80mm; padding: 4mm; }
          .no-print { display: none !important; }
        }
        @media screen {
          .print-area { width: 80mm; margin: 0 auto; }
        }
      `}</style>

      <div className="fixed inset-0 z-[60] flex flex-col items-stretch justify-end bg-black/70 p-0 backdrop-blur-sm no-print sm:items-center sm:justify-center sm:p-4">
        <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold">ตัวอย่างใบครัว</h3>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 transition-all hover:bg-red-200 active:scale-95"
              title="ปิด"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">กด <Printer className="inline h-4 w-4" /> เพื่อพิมพ์ หรือใช้ Ctrl/Cmd+P</p>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => window.print()}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white btn-premium"
            >
              <Printer className="mr-2 h-4 w-4" /> พิมพ์อีกครั้ง
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" /> ปิด
            </Button>
          </div>
        </div>
      </div>

      <div className="print-area" style={{ fontFamily: "monospace", color: "#000", background: "#fff" }}>
        <div style={{ textAlign: "center", borderBottom: "2px dashed #000", paddingBottom: "8px", marginBottom: "8px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: "0 0 4px" }}>🍳 ใบสั่งครัว</h1>
          <div style={{ fontSize: "12px" }}>{shopName}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "8px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#666" }}>ออเดอร์</div>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>#{orderNo}</div>
          </div>
          {tableNo && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "#666" }}>โต๊ะ</div>
              <div style={{ fontWeight: "bold", fontSize: "16px" }}>{tableNo}</div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", marginBottom: "8px" }}>
          <span>{date}</span>
          <span>{time}</span>
        </div>

        <div style={{ borderTop: "1px dashed #000", borderBottom: "2px dashed #000", padding: "8px 0", marginBottom: "8px" }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}>
                <span style={{ flex: 1 }}>{it.productName}</span>
                <span style={{ minWidth: "30px", textAlign: "right" }}>×{it.qty}</span>
              </div>
              {it.note && (
                <div style={{ fontSize: "11px", color: "#000", fontStyle: "italic", marginTop: "2px", paddingLeft: "8px" }}>
                  📝 {it.note}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: "bold" }}>
          <span>รวม</span>
          <span>฿{total.toLocaleString()}</span>
        </div>

        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "10px", color: "#666", borderTop: "1px dashed #000", paddingTop: "8px" }}>
          พิมพ์เมื่อ {new Date().toLocaleString("th-TH")}
        </div>
      </div>
    </>
  );
}
