"use client";

import { useEffect, useState } from "react";
import { Clock, ChefHat, Check, Printer, X, Plus, Minus, Search } from "lucide-react";

interface KitchenOrder {
  id: string;
  orderNo: string;
  status: string;
  source?: string;
  total?: any;
  items?: any[];
  createdAt: string;
  [key: string]: any;
}

interface Props {
  orders: KitchenOrder[];
}

export default function KitchenDashboard({ orders: initialOrders }: Props) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders || []);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<KitchenOrder[]>([]);
  const [printing, setPrinting] = useState<KitchenOrder | null>(null);

  // ─── Add items dialog state ────────────────────────────────────────────────
  const [addingItemsOrder, setAddingItemsOrder] = useState<KitchenOrder | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [addingProducts, setAddingProducts] = useState<any[]>([]);
  const [addingItems, setAddingItems] = useState<any[]>([]);
  const [addingLoading, setAddingLoading] = useState(false);

  async function fetchProducts(q: string) {
    setProductSearch(q);
    if (!q.trim()) { setAddingProducts([]); return; }
    try {
      const res = await fetch(`/api/kitchen/products?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAddingProducts(data.products || []);
    } catch { setAddingProducts([]); }
  }

  function addItemToList(product: { id: string; name: string; price: number }) {
    const existing = addingItems.find((i) => i.id === product.id);
    if (existing) {
      setAddingItems(addingItems.map((i) =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      ));
    } else {
      setAddingItems([...addingItems, { ...product, qty: 1 }]);
    }
  }

  function removeItem(id: string) {
    setAddingItems(addingItems.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) removeItem(id);
    else setAddingItems(addingItems.map((i) => i.id === id ? { ...i, qty } : i));
  }

  async function submitAddItems() {
    if (!addingItemsOrder || addingItems.length === 0) return;
    setAddingLoading(true);
    try {
      const res = await fetch("/api/kitchen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNo: addingItemsOrder.orderNo,
          action: "add-items",
          items: addingItems.map((i) => ({ productId: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddingItemsOrder(null);
        setAddingItems([]);
        setAddingProducts([]);
        setProductSearch("");
        fetchOrders();
      } else {
        alert(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      alert("เกิดข้อผิดพลาด");
    } finally {
      setAddingLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/kitchen");
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) { console.error("Failed to fetch orders:", e); }
  }

  async function updateStatus(id: string, status: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/kitchen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, action: "status", status }),
      });
      const data = await res.json();
      if (data.success) fetchOrders();
    } catch (e) { console.error("Failed to update status:", e); }
    finally { setLoading(false); }
  }

  const filtered = statusFilters.length
    ? orders.filter((o) => statusFilters.includes(o.status))
    : orders;

  useEffect(() => { setActive(filtered); }, [filtered]);

  const statusConfig: Record<string, { label: string; cls: string; bg: string }> = {
    PENDING: { label: "รอทำ", cls: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
    PREPARING: { label: "กำลังทำ", cls: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
    READY: { label: "พร้อมเสิร์ฟ", cls: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  };

  const allStatuses = [...new Set(orders.map((o) => o.status))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-7 w-7 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold">ครัว</h1>
              <p className="text-xs text-white/50">{orders.length} ออเดอร์ทั้งหมด</p>
            </div>
          </div>
          {allStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilters([])}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                  statusFilters.length === 0 ? "border-white/40 bg-white/10 text-white" : "border-white/20 text-white/50 hover:border-white/30 hover:text-white/70"
                }`}
              >
                ทั้งหมด
              </button>
              {allStatuses.map((s) => {
                const cfg = statusConfig[s];
                if (!cfg) return null;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilters((f) =>
                      f.includes(s) ? f.filter((x) => x !== s) : [...f, s]
                    )}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      statusFilters.includes(s) ? `${cfg.cls} ${cfg.bg} border-current` : "border-white/20 text-white/50 hover:border-white/30 hover:text-white/70"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/40 hover:bg-white/5"
          >
            <Clock className="h-4 w-4" />รีเฟรช
          </button>
        </div>
      </div>

      {/* Orders grid */}
      <div className="grid auto-rows-min gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {active.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <ChefHat className="h-16 w-16 text-white/20" />
            <p className="mt-3 text-white/40">
              {statusFilters.length > 0 ? "ไม่มีออเดอร์ในสถานะที่เลือก" : "ยังไม่มีออเดอร์"}
            </p>
          </div>
        ) : (
          active.map((o) => {
            const cfg = statusConfig[o.status] ?? { label: o.status, cls: "text-white", bg: "bg-white/10 border-white/20" };
            return (
              <div key={o.id} className={`rounded-2xl border p-4 ${cfg.bg} ${loading ? "opacity-60" : ""}`}>
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white/40">#{o.orderNo}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cfg.cls} border-current`}>{cfg.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">{o.source || "ออเดอร์ใหม่"}</p>
                  </div>
                  <p className="text-right text-xs text-white/40">
                    {new Date(o.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  {o.items?.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-xl bg-black/20 p-2.5">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.status === "PENDING" ? "bg-yellow-500/20 text-yellow-400" :
                        item.status === "PREPARING" ? "bg-blue-500/20 text-blue-400" :
                        item.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/60"
                      }`}>{item.qty}×</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{item.productName}</p>
                        {item.note && <p className="mt-0.5 text-xs text-white/40">📝 {item.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "PENDING" && (
                    <button onClick={() => updateStatus(o.id, "PREPARING")} disabled={loading}
                      className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-95 disabled:cursor-not-allowed">
                      เริ่มทำ
                    </button>
                  )}
                  {o.status === "PREPARING" && (
                    <button onClick={() => updateStatus(o.id, "READY")} disabled={loading}
                      className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-500 active:scale-95 disabled:cursor-not-allowed">
                      เสร็จแล้ว
                    </button>
                  )}
                  {o.status === "READY" && (
                    <button onClick={() => updateStatus(o.id, "COMPLETED")} disabled={loading}
                      className="flex-1 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95 disabled:cursor-not-allowed">
                      เสิร์ฟแล้ว
                    </button>
                  )}
                  <button onClick={() => setPrinting(o)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white/60 transition-all hover:border-white/40 hover:bg-white/5"
                    title="พิมพ์ใบครัว">
                    <Printer className="h-4 w-4" />
                  </button>
                  {/* +เพิ่มรายการ button */}
                  <button
                    onClick={() => { setAddingItemsOrder(o); fetchProducts(""); setAddingItems([]); }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition-all hover:bg-green-500 active:scale-95"
                    title="เพิ่มรายการ"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {o.status === "PENDING" && (
                  <button onClick={() => { if (confirm("ยกเลิกออเดอร์?")) updateStatus(o.id, "CANCELLED"); }}
                    className="mt-2 w-full rounded-xl border border-red-500/30 py-2 text-center text-xs text-red-400 transition-all hover:border-red-500/60 hover:bg-red-500/5">
                    ยกเลิกออเดอร์
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Print dialog */}
      {printing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">พิมพ์ใบครัว</h2>
              <button onClick={() => setPrinting(null)} className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-1 text-sm text-slate-400">ออเดอร์</p>
            <p className="mb-4 text-2xl font-bold">#{printing.orderNo}</p>
            <div className="mb-6 space-y-2">
              {printing.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.qty}× {item.productName}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPrinting(null)}
                className="flex-1 rounded-xl border border-white/20 py-3 text-sm font-medium transition-all hover:bg-white/5">
                ยกเลิก
              </button>
              <button onClick={() => setPrinting(null)}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-95">
                พิมพ์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Items Dialog */}
      {addingItemsOrder && (
        <AddItemsDialog
          order={addingItemsOrder}
          onClose={() => { setAddingItemsOrder(null); setAddingItems([]); setAddingProducts([]); setProductSearch(""); }}
          addingProducts={addingProducts}
          productSearch={productSearch}
          addingItems={addingItems}
          addingLoading={addingLoading}
          onSearch={fetchProducts}
          onAddItem={addItemToList}
          onRemoveItem={removeItem}
          onQtyChange={updateQty}
          onSubmit={submitAddItems}
        />
      )}
    </div>
  );
}

// ─── Add Items Dialog Component ──────────────────────────────────────────────
function AddItemsDialog({
  order, onClose, addingProducts, productSearch, addingItems, addingLoading,
  onSearch, onAddItem, onRemoveItem, onQtyChange, onSubmit,
}: {
  order: any;
  onClose: () => void;
  addingProducts: any[];
  productSearch: string;
  addingItems: any[];
  addingLoading: boolean;
  onSearch: (q: string) => void;
  onAddItem: (p: any) => void;
  onRemoveItem: (id: string) => void;
  onQtyChange: (id: string, qty: number) => void;
  onSubmit: () => void;
}) {
  const totalAdded = addingItems.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between rounded-t-2xl border-b p-4">
          <div>
            <h2 className="text-lg font-bold">เพิ่มรายการในออเดอร์</h2>
            <p className="text-xs text-muted-foreground">
              #{order.orderNo} · {order.source || "ออเดอร์ใหม่"}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              placeholder="ค้นหาสินค้า..."
              value={productSearch}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          {addingProducts.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border">
              {addingProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onAddItem(p)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted transition-colors"
                >
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm text-muted-foreground">{p.price.toLocaleString()} บาท</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {addingItems.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="mb-2 text-sm font-semibold">รายการที่จะเพิ่ม</p>
            <div className="space-y-2">
              {addingItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQtyChange(item.id, item.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-xs font-bold hover:bg-white transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => onQtyChange(item.id, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/80 text-xs font-bold hover:bg-white transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{(item.price * item.qty).toLocaleString()} บาท</span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-red-100 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between rounded-b-2xl border-t p-4">
          <div>
            {addingItems.length > 0 && (
              <p className="text-sm text-muted-foreground">
                รวม <span className="font-bold text-foreground">{totalAdded.toLocaleString()} บาท</span>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted">
              ยกเลิก
            </button>
            <button
              onClick={onSubmit}
              disabled={addingItems.length === 0 || addingLoading}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addingLoading ? "กำลังเพิ่ม..." : addingItems.length > 0 ? `เพิ่ม ${addingItems.length} รายการ` : "เพิ่มรายการ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
