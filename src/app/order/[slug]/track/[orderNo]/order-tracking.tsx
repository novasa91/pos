"use client";

import { useEffect, useState } from "react";
import { Clock, Check, ChefHat, X, ShoppingBag, Phone, ArrowLeft, RefreshCw, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";

type Item = { productName: string; qty: number; price: number; note: string | null };

const STEPS = [
  { key: "PENDING", label: "รับออเดอร์", icon: ShoppingBag, color: "from-amber-400 to-orange-500" },
  { key: "PREPARING", label: "กำลังทำ", icon: ChefHat, color: "from-blue-400 to-cyan-500" },
  { key: "READY", label: "เสร็จแล้ว", icon: Utensils, color: "from-emerald-400 to-green-500" },
  { key: "COMPLETED", label: "เสิร์ฟแล้ว", icon: Check, color: "from-purple-400 to-pink-500" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "รอเชฟรับออเดอร์",
  PREPARING: "เชฟกำลังทำอาหาร",
  READY: "อาหารเสร็จแล้ว!",
  COMPLETED: "เสิร์ฟเรียบร้อย",
  CANCELLED: "ออเดอร์ถูกยกเลิก",
};

export function OrderTracking({
  shopName,
  shopPhone,
  orderNo,
  tableNo,
  tableName,
  status,
  total,
  createdAt,
  items,
}: {
  shopName: string;
  shopPhone: string | null;
  orderNo: string;
  tableNo: string | null;
  tableName: string | null;
  status: string;
  total: number;
  createdAt: string;
  items: Item[];
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [createdAt]);

  // Poll status every 5s
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/status/${orderNo}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) setCurrentStatus(data.status);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [orderNo]);

  const isCancelled = currentStatus === "CANCELLED";
  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf5ff] via-white to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#e9d5ff]/40 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold">{shopName}</div>
            <div className="text-xs text-muted-foreground">ติดตามออเดอร์</div>
          </div>
          <button
            onClick={() => router.refresh()}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            title="รีเฟรช"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-5 p-4">
        {/* Status header */}
        <div className={`overflow-hidden rounded-3xl border-2 bg-white shadow-lg ${
          isCancelled ? "border-red-200" : "border-[#7c3aed]/20"
        }`}>
          <div className={`h-2 ${isCancelled ? "bg-red-500" : "bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#06b6d4] animate-shimmer"}`} />
          <div className="p-6 text-center">
            {isCancelled ? (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <X className="h-8 w-8 text-red-500" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold text-red-600">ออเดอร์ถูกยกเลิก</h1>
                <p className="mt-2 text-sm text-muted-foreground">กรุณาติดต่อร้านค้าหากมีข้อสงสัย</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/20 animate-pulse">
                  <ChefHat className="h-8 w-8 text-[#7c3aed] animate-float" />
                </div>
                <h1 className="text-2xl font-bold">{STATUS_LABELS[currentStatus]}</h1>
                <p className="mt-2 text-sm text-muted-foreground">ออเดอร์ #{orderNo}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#faf5ff] px-3 py-1 text-xs font-semibold text-[#7c3aed]">
                  <Clock className="h-3 w-3" /> {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress steps */}
        {!isCancelled && (
          <div className="rounded-2xl border border-[#e9d5ff] bg-white p-5">
            <div className="space-y-4">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
                      isDone
                        ? `bg-gradient-to-br ${step.color} text-white shadow-md`
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <Icon className="h-5 w-5" /> : <Icon className="h-5 w-5 opacity-50" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.label}
                      </div>
                      {isCurrent && <div className="text-xs text-[#7c3aed]">กำลังดำเนินการ...</div>}
                    </div>
                    {isCurrent && (
                      <div className="flex h-2 w-2 animate-pulse rounded-full bg-[#7c3aed]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="rounded-2xl border border-[#e9d5ff] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">รายการที่สั่ง</h3>
            {tableNo && (
              <span className="rounded-full bg-[#faf5ff] px-2 py-0.5 text-xs font-semibold text-[#7c3aed]">
                โต๊ะ {tableNo}{tableName ? ` · ${tableName}` : ""}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-start justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{it.productName}</div>
                  {it.note && <div className="text-xs italic text-amber-600">📝 {it.note}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm">× {it.qty}</div>
                  <div className="text-xs text-muted-foreground">฿{(it.qty * it.price).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <span className="font-semibold">รวม</span>
            <span className="text-2xl font-bold text-[#5b21b6]">฿{total.toLocaleString()}</span>
          </div>
        </div>

        {/* Contact */}
        {shopPhone && (
          <a
            href={`tel:${shopPhone}`}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#7c3aed]/30 bg-gradient-to-r from-white to-[#faf5ff] p-4 text-sm font-semibold text-[#5b21b6] hover:border-[#7c3aed]"
          >
            <Phone className="h-4 w-4" /> โทรหาร้าน {shopPhone}
          </a>
        )}
      </div>
    </div>
  );
}
