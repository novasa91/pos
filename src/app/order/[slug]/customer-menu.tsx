"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Plus, Minus, X, ShoppingCart, ChevronRight, Check } from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName: string;
  trackStock: boolean;
  stock: number;
};

type CartItem = { product: Product; qty: number; note?: string };

export function CustomerMenu({
  shopName,
  products,
  categories,
  initialTable = "",
}: {
  shopName: string;
  products: Product[];
  categories: { id: string; name: string }[];
  initialTable?: string;
}) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = !activeCat || p.categoryName === activeCat;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, activeCat, search]);

  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  function addToCart(p: Product) {
    setCart((c) => {
      const exist = c.find((i) => i.product.id === p.id);
      if (exist) return c.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { product: p, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart((c) =>
      c
        .map((i) => (i.product.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const [submittedOrderNo, setSubmittedOrderNo] = useState<string | null>(null);

  async function submitOrder() {
    if (cart.length === 0) return;
    setOrderSent(true);
    try {
      const slug = window.location.pathname.split("/").pop();
      const res = await fetch(`/api/order/create/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.product.id, qty: i.qty })),
          tableNo: tableNo || null,
        }),
      });
      const data = await res.json();
      if (data.order?.orderNo) {
        setSubmittedOrderNo(data.order.orderNo);
      }
    } catch (e) {
      console.error("Order submit failed", e);
    }
  }

  // After success, redirect to payment page
  useEffect(() => {
    if (orderSent && submittedOrderNo) {
      const slug = window.location.pathname.split("/").pop();
      setTimeout(() => {
        window.location.href = `/order/${slug}/pay/${submittedOrderNo}?method=promptpay`;
      }, 1500);
    }
  }, [orderSent, submittedOrderNo]);

  // หลังจ่ายเงินเสร็จ → redirect ไปหน้าติดตาม order
  useEffect(() => {
    if (status === "PAID") {
      const slug = window.location.pathname.split("/").pop();
      setTimeout(() => {
        if (submittedOrderNo) {
          window.location.href = `/order/${slug}/track/${submittedOrderNo}`;
        }
      }, 2000);
    }
  }, [status, submittedOrderNo]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0fdfa] via-white to-white">
      {/* Hero header */}
      <div className="sticky top-0 z-30 bg-gradient-to-br from-[#0d9488] via-[#2dd4bf] to-[#0d9488] text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider opacity-80">ยินดีต้อนรับ</div>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{shopName}</h1>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-all active:scale-95 hover:bg-white/30"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-bold text-amber-950 shadow-lg">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
            <Search className="h-5 w-5 opacity-80" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/60"
            />
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-[140px] z-20 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button
            onClick={() => setActiveCat(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              !activeCat
                ? "bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] text-white shadow-md shadow-[#2dd4bf]/30"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.name)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                activeCat === c.name
                  ? "bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] text-white shadow-md shadow-[#2dd4bf]/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="mx-auto max-w-5xl px-4 py-5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl">🍽️</div>
            <p className="mt-3 text-muted-foreground">ไม่พบเมนู</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((p, i) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#2dd4bf]/40 hover:shadow-lg active:scale-95"
                style={{ animation: `scaleIn 0.3s var(--ease-spring) both`, animationDelay: `${i * 30}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#f0fdfa] to-[#e2e8f0]">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl">🍽️</div>
                  )}
                  <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#0d9488] opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    <Plus className="h-4 w-4" />
                  </div>
                  {p.trackStock && p.stock <= 5 && (
                    <div className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      เหลือ {p.stock}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 text-sm font-semibold leading-tight">{p.name}</div>
                  <div className="mt-1 text-base font-bold text-[#0d9488]">฿{p.price.toLocaleString()}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating cart button (mobile) */}
      {totalItems > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] px-5 py-3.5 text-white shadow-2xl shadow-[#0d9488]/30 transition-transform active:scale-95 md:left-auto md:right-6 md:w-auto"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">{totalItems} รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">฿{total.toLocaleString()}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md animate-slide-in-bottom rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-bold">ตะกร้าของคุณ</h2>
              <button onClick={() => setShowCart(false)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            {orderSent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg animate-scale-in">
                  <Check className="h-10 w-10 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-bold text-emerald-600">ส่งออเดอร์แล้ว!</h3>
                <p className="mt-1 text-sm text-muted-foreground">รอสักครู่ เชฟกำลังทำให้</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">ยังไม่มีรายการ</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 space-y-2 overflow-y-auto p-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-2">
                      {item.product.imageUrl && (
                        <img src={item.product.imageUrl} alt={item.product.name} className="h-14 w-14 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-semibold leading-tight">{item.product.name}</div>
                        <div className="text-xs text-[#0d9488]">฿{item.product.price}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(item.product.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/70">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                        <button onClick={() => updateQty(item.product.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0d9488] text-white hover:bg-[#0d9488]/90">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table input */}
                <div className="border-t p-4">
                  <label className="text-xs font-medium text-muted-foreground">เลขโต๊ะ (ถ้ามี)</label>
                  <input
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    placeholder="เช่น 5"
                    className="mt-1 w-full rounded-xl border border-[#e2e8f0] px-3 py-2 text-sm outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div className="border-t p-4">
                  <div className="mb-3 flex items-center justify-between text-base">
                    <span className="font-semibold">รวมทั้งหมด</span>
                    <span className="text-2xl font-bold text-[#0d9488]">฿{total.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={submitOrder}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#2dd4bf] py-3.5 font-bold text-white shadow-lg shadow-[#0d9488]/20 transition-all hover:shadow-[#2dd4bf]/40 active:scale-95"
                  >
                    ส่งออเดอร์
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-in-bottom {
          from { transform: translateY(100%); opacity: 0.5; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-in-bottom { animation: slide-in-bottom 0.3s var(--ease-spring) both; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
