"use client";

import { useState } from "react";
import { Plus, X, Trash2, Package, Truck, Calendar, DollarSign, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; sku: string | null; stock: number; cost: number; price: number };
type PurchaseItem = { productId: string; productName: string; quantity: number; cost: number; total: number };
type Purchase = {
  id: string;
  reference: string | null;
  total: number;
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: { id: string; productId: string; quantity: number; cost: number; total: number; product: { name: string; sku: string | null } }[];
};

export function PurchasesView({
  initialPurchases,
  suppliers,
  products,
}: {
  initialPurchases: Purchase[];
  suppliers: Supplier[];
  products: Product[];
}) {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/purchases");
    if (res.ok) {
      const data = await res.json();
      setPurchases(data.purchases);
    }
  }

  const totalValue = purchases.reduce((s, p) => s + p.total, 0);
  const thisMonth = purchases.filter((p) => new Date(p.createdAt).getMonth() === new Date().getMonth()).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ใบซื้อเข้า</h1>
          <p className="text-sm text-muted-foreground">บันทึกการซื้อจากซัพพลายเออร์ — ตัดสต็อกอัตโนมัติ</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="h-10 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white shadow-md btn-premium"
        >
          <Plus className="mr-2 h-4 w-4" /> สร้างใบซื้อเข้า
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-[#7c3aed]/20">
          <div className="text-xs text-muted-foreground">ใบซื้อทั้งหมด</div>
          <div className="mt-1 text-3xl font-bold text-[#7c3aed]">{purchases.length}</div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="text-xs text-emerald-700">เดือนนี้</div>
          <div className="mt-1 text-3xl font-bold text-emerald-600">{thisMonth}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50/50">
          <div className="text-xs text-orange-700">มูลค่ารวม</div>
          <div className="mt-1 text-2xl font-bold text-orange-600">฿{totalValue.toLocaleString()}</div>
        </Card>
      </div>

      {/* Purchase list */}
      {purchases.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#e9d5ff] bg-white/40 p-10 text-center">
          <Truck className="mx-auto mb-2 h-12 w-12 text-[#7c3aed]/30" />
          <p className="text-sm text-muted-foreground">ยังไม่มีใบซื้อเข้า</p>
          <Button onClick={() => setShowForm(true)} className="mt-3 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white">
            <Plus className="mr-2 h-4 w-4" /> สร้างใบแรก
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => {
            const isOpen = expanded === p.id;
            return (
              <Card key={p.id} className="overflow-hidden border-[#e9d5ff]">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white shadow">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span>{p.supplier.name}</span>
                      {p.reference && <span className="text-xs text-muted-foreground">#{p.reference}</span>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(p.createdAt).toLocaleDateString("th-TH")}</span>
                      <span>{p.items.length} รายการ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#5b21b6]">฿{p.total.toLocaleString()}</div>
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t bg-[#faf5ff]/30 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground">
                          <th className="pb-2 text-left">สินค้า</th>
                          <th className="pb-2 text-right">จำนวน</th>
                          <th className="pb-2 text-right">ต้นทุน</th>
                          <th className="pb-2 text-right">รวม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.items.map((it) => (
                          <tr key={it.id} className="border-t">
                            <td className="py-2">
                              <div className="font-medium">{it.product.name}</div>
                              <div className="text-xs text-muted-foreground">SKU: {it.product.sku}</div>
                            </td>
                            <td className="py-2 text-right">{it.quantity}</td>
                            <td className="py-2 text-right">฿{it.cost.toLocaleString()}</td>
                            <td className="py-2 text-right font-semibold">฿{it.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.notes && (
                      <div className="mt-3 rounded-lg border bg-white p-2 text-xs text-muted-foreground">
                        📝 {p.notes}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <PurchaseForm
          suppliers={suppliers}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={async () => {
            setShowForm(false);
            await refresh();
            toast.success("สร้างใบซื้อเข้าสำเร็จ สต็อกอัปเดตแล้ว");
          }}
        />
      )}
    </div>
  );
}

function PurchaseForm({
  suppliers,
  products,
  onClose,
  onSaved,
}: {
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; quantity: number; cost: number }[]>([
    { productId: products[0]?.id || "", quantity: 1, cost: products[0]?.cost || 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((s, it) => s + it.quantity * it.cost, 0);

  function updateItem(idx: number, key: string, value: any) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }

  function addItem() {
    setItems((arr) => [...arr, { productId: products[0]?.id || "", quantity: 1, cost: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx));
  }

  function selectProduct(idx: number, productId: string) {
    const p = products.find((pp) => pp.id === productId);
    setItems((arr) => arr.map((it, i) => i === idx ? { ...it, productId, cost: p?.cost || 0 } : it));
  }

  async function save() {
    setError("");
    if (!supplierId) {
      setError("กรุณาเลือกซัพพลายเออร์");
      return;
    }
    if (items.some((it) => !it.productId || it.quantity <= 0)) {
      setError("กรุณาเลือกสินค้าและจำนวนให้ครบ");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, reference, notes, items }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "บันทึกไม่สำเร็จ");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-[#7c3aed]/20 p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">สร้างใบซื้อเข้า</h3>
            <p className="text-xs text-muted-foreground">ระบบจะเพิ่มสต็อกสินค้าอัตโนมัติเมื่อบันทึก</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>ซัพพลายเออร์ *</Label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-[#e9d5ff] bg-white px-3 text-sm"
              >
                {suppliers.length === 0 ? <option value="">ยังไม่มีซัพพลายเออร์</option> : null}
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>เลขที่ใบส่งของ (optional)</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="INV-001" className="mt-1 h-10 rounded-xl" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>รายการสินค้า</Label>
              <button onClick={addItem} className="flex items-center gap-1 text-xs font-semibold text-[#7c3aed] hover:underline">
                <Plus className="h-3 w-3" /> เพิ่มรายการ
              </button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="rounded-xl border border-[#e9d5ff] bg-white p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 sm:col-span-6">
                      <select
                        value={it.productId}
                        onChange={(e) => selectProduct(idx, e.target.value)}
                        className="h-9 w-full rounded-lg border bg-white px-2 text-sm"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (คงเหลือ {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <Input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-3">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={it.cost}
                        onChange={(e) => updateItem(idx, "cost", parseFloat(e.target.value) || 0)}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
                      <button
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-right text-xs text-muted-foreground">
                    รวม: ฿{(it.quantity * it.cost).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>หมายเหตุ</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="..." className="mt-1 h-10 rounded-xl" />
          </div>

          {/* Total */}
          <div className="rounded-xl border-2 border-[#7c3aed]/30 bg-gradient-to-br from-[#faf5ff] to-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">มูลค่ารวม</span>
              <span className="text-3xl font-bold text-[#5b21b6]">฿{total.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">ยกเลิก</Button>
          <Button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white btn-premium"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกใบซื้อเข้า"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
