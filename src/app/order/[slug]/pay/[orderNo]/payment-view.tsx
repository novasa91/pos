"use client";

import { useState, useEffect } from "react";
import { QrCode, CreditCard, Banknote, Check, Clock, X, ArrowLeft, Wallet, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";

type OrderItem = { productName: string; qty: number; price: number };

export function PaymentView({
  shopName,
  shopSlug,
  orderNo,
  tableNo,
  total,
  items,
  promptPayQrUrl,
  initialMethod,
  promptPayPhone,
  promptPayName,
}: {
  shopName: string;
  shopSlug: string;
  orderNo: string;
  tableNo: string | null;
  total: number;
  items: OrderItem[];
  promptPayQrUrl: string;
  initialMethod: string;
  promptPayPhone: string;
  promptPayName?: string;
}) {
  const [method, setMethod] = useState(initialMethod);
  const [status, setStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [seconds, setSeconds] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll order status every 3s to auto-detect payment confirmation
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/order/status/${orderNo}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID" || data.status === "READY" || data.status === "COMPLETED") {
            setStatus("PAID");
          }
        }
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [orderNo]);

  const methods = [
    { id: "promptpay", name: "PromptPay", desc: "สแกน QR จ่ายผ่านแอปธนาคาร", icon: QrCode, color: "from-blue-500 to-cyan-500" },
    { id: "card", name: "บัตรเครดิต/เดบิต", desc: "Visa, Mastercard, JCB", icon: CreditCard, color: "from-purple-500 to-pink-500" },
    { id: "wallet", name: "E-Wallet", desc: "TrueMoney, Rabbit LINE Pay, ShopeePay", icon: Smartphone, color: "from-orange-500 to-amber-500" },
    { id: "cash", name: "เงินสด", desc: "จ่ายที่เคาน์เตอร์", icon: Banknote, color: "from-emerald-500 to-green-500" },
  ];

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#faf5ff] via-white to-white">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-[#e9d5ff]/40 bg-white/80 px-4 py-3 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold">{shopName}</div>
            <div className="text-xs text-muted-foreground">ชำระเงิน</div>
          </div>
          <div className="flex h-9 items-center gap-1 rounded-full bg-[#faf5ff] px-3 text-xs font-semibold text-[#7c3aed]">
            <Clock className="h-3 w-3" /> {formatTime(seconds)}
          </div>
        </div>
      </div>

      {status === "PAID" ? (
        <PaidView orderNo={orderNo} />
      ) : (
        <div className="mx-auto max-w-2xl space-y-5 p-4">
          {/* Order Summary */}
          <div className="rounded-2xl border border-[#e9d5ff] bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">ออเดอร์</div>
                <div className="text-lg font-bold">#{orderNo}</div>
                {tableNo && <div className="text-xs text-muted-foreground">โต๊ะ {tableNo}</div>}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">ยอดรวม</div>
                <div className="text-3xl font-bold text-[#7c3aed]">฿{total.toLocaleString()}</div>
              </div>
            </div>
            <div className="space-y-1 border-t pt-3">
              {items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{it.productName} × {it.qty}</span>
                  <span>฿{(it.qty * it.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                    active
                      ? "border-[#7c3aed] bg-gradient-to-br from-[#faf5ff] to-white shadow-lg shadow-[#7c3aed]/15"
                      : "border-[#e9d5ff] bg-white hover:border-[#7c3aed]/40"
                  }`}
                >
                  <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} shadow-md`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.desc}</div>
                  {active && (
                    <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7c3aed] text-white shadow">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Payment Method Content */}
          {method === "promptpay" && (
            <div className="rounded-2xl border-2 border-[#7c3aed] bg-white p-6 shadow-lg shadow-[#7c3aed]/10">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">PromptPay QR</div>
                  <div className="text-xs text-muted-foreground">สแกนด้วยแอปธนาคารของคุณ</div>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-dashed border-[#7c3aed]/30 bg-gradient-to-br from-white to-[#faf5ff] p-4">
                <img src={promptPayQrUrl} alt="PromptPay QR" className="mx-auto h-56 w-56" />
              </div>
              <div className="mt-4 text-center space-y-1">
                {promptPayName && (
                  <div className="text-sm font-semibold text-foreground">{promptPayName}</div>
                )}
                <div className="text-xs text-muted-foreground">เบอร์รับเงิน</div>
                <div className="font-mono text-lg font-bold text-[#7c3aed]">
                  {promptPayPhone.length === 10
                    ? promptPayPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
                    : promptPayPhone}
                </div>
                <div className="mt-1 text-2xl font-bold text-[#7c3aed]">฿{total.toLocaleString()}</div>
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                💡 <strong>วิธีจ่าย:</strong> เปิดแอปธนาคาร → สแกน QR → ตรวจสอบยอด → ยืนยัน
              </div>
            </div>
          )}

          {method === "card" && (
            <div className="rounded-2xl border-2 border-[#7c3aed] bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">ชำระด้วยบัตร</div>
                  <div className="text-xs text-muted-foreground">รองรับ Visa, Mastercard, JCB</div>
                </div>
              </div>
              <div className="rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-8 text-center">
                <CreditCard className="mx-auto mb-3 h-16 w-16 text-[#7c3aed]/40" />
                <p className="text-sm text-muted-foreground">ระบบจะเปิดเครื่องรูดบัตร (EDC) อัตโนมัติ</p>
                <button className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] px-6 text-sm font-semibold text-white shadow-md btn-premium">
                  <Wallet className="h-4 w-4" /> เริ่มรูดบัตร
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>🔒 SSL</span> · <span>PCI DSS</span> · <span>3D Secure</span>
              </div>
            </div>
          )}

          {method === "wallet" && (
            <div className="rounded-2xl border-2 border-[#7c3aed] bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">E-Wallet</div>
                  <div className="text-xs text-muted-foreground">เลือกแอปที่ต้องการ</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "TrueMoney", color: "from-orange-500 to-red-500", emoji: "💰" },
                  { name: "Rabbit LINE Pay", color: "from-green-500 to-emerald-500", emoji: "🐰" },
                  { name: "ShopeePay", color: "from-orange-500 to-yellow-500", emoji: "🛒" },
                ].map((w) => (
                  <button
                    key={w.name}
                    className="rounded-xl border border-[#e9d5ff] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#7c3aed]/40 hover:shadow-md"
                  >
                    <div className="text-2xl">{w.emoji}</div>
                    <div className="mt-2 text-xs font-semibold">{w.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === "cash" && (
            <div className="rounded-2xl border-2 border-[#7c3aed] bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
                  <Banknote className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">ชำระเงินสด</div>
                  <div className="text-xs text-muted-foreground">ยืนยันเพื่อแจ้งพนักงาน</div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <Banknote className="mx-auto mb-2 h-12 w-12 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-900">ยอดที่ต้องชำระ</p>
                <p className="text-3xl font-bold text-emerald-600">฿{total.toLocaleString()}</p>
                <p className="mt-2 text-xs text-emerald-700">กรุณาชำระที่เคาน์เตอร์หรือให้พนักงานมารับ</p>
              </div>
              <button
                onClick={() => setStatus("PAID")}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 py-3 font-semibold text-white shadow-md btn-premium"
              >
                ยืนยันจ่ายเงินสดแล้ว
              </button>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-center gap-2 rounded-xl bg-[#faf5ff] p-3 text-sm text-[#7c3aed]">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#7c3aed]" />
            <span>รอการชำระเงิน...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PaidView({ orderNo }: { orderNo: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30 animate-scale-in">
        <Check className="h-12 w-12 text-white" strokeWidth={3} />
      </div>
      <h2 className="text-3xl font-bold text-emerald-600">ชำระเงินสำเร็จ!</h2>
      <p className="mt-2 text-muted-foreground">ออเดอร์ #{orderNo}</p>
      <p className="mt-1 text-sm text-muted-foreground">รอเชฟทำอาหารให้สักครู่</p>
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5">
        <p className="text-sm text-emerald-800">
          ✅ เราได้รับการชำระเงินแล้ว<br/>
          📲 พนักงานได้รับแจ้งเตือนแล้ว<br/>
          🍳 กำลังเตรียมอาหารให้คุณ
        </p>
      </div>
    </div>
  );
}
