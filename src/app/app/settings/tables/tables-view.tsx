"use client";

import { useState, useMemo } from "react";
import { Plus, QrCode, Trash2, Coffee, Users, Power, Copy, Check, X, Edit2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Table = {
  id: string;
  number: string;
  name: string | null;
  capacity: number;
  status: string;
  active: boolean;
  createdAt: string;
  orders: {
    id: string;
    orderNo: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
};

export function TablesView({
  slug,
  shopName,
  initialTables,
}: {
  slug: string;
  shopName: string;
  initialTables: Table[];
}) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [addCount, setAddCount] = useState(10);
  const [prefix, setPrefix] = useState("");
  const [adding, setAdding] = useState(false);
  const [qrTable, setQrTable] = useState<Table | null>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [copied, setCopied] = useState(false);

  async function addTables() {
    setAdding(true);
    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: addCount, prefix }),
      });
      if (res.ok) {
        const data = await res.json();
        await refresh();
        alert(`เพิ่ม ${data.created} โต๊ะเรียบร้อย`);
      }
    } finally {
      setAdding(false);
    }
  }

  async function deleteTable(id: string) {
    if (!confirm("ลบโต๊ะนี้? (ออเดอร์ที่ผูกอยู่จะไม่ถูกลบ)")) return;
    await fetch("/api/tables", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  async function toggleActive(t: Table) {
    await fetch("/api/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, active: !t.active }),
    });
    await refresh();
  }

  async function saveEdit(t: Table, data: Partial<Table>) {
    await fetch("/api/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, ...data }),
    });
    setEditingTable(null);
    await refresh();
  }

  async function refresh() {
    const res = await fetch("/api/tables");
    if (res.ok) {
      const data = await res.json();
      setTables(data.tables);
    }
  }

  const stats = useMemo(() => {
    const occupied = tables.filter((t) => t.orders.length > 0).length;
    const available = tables.filter((t) => t.active && t.orders.length === 0).length;
    return { total: tables.length, occupied, available };
  }, [tables]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">จัดการโต๊ะ</h1>
        <p className="text-sm text-muted-foreground">สร้าง QR Code ต่อโต๊ะ — ลูกค้าสแกนเพื่อสั่งอาหารและจ่ายเงินแยกตามโต๊ะ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-[#7c3aed]/20">
          <div className="text-xs text-muted-foreground">โต๊ะทั้งหมด</div>
          <div className="text-3xl font-bold text-[#7c3aed]">{stats.total}</div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <div className="text-xs text-emerald-700">ว่าง</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.available}</div>
        </Card>
        <Card className="p-4 border-orange-200 bg-orange-50/50">
          <div className="text-xs text-orange-700">ไม่ว่าง</div>
          <div className="text-3xl font-bold text-orange-600">{stats.occupied}</div>
        </Card>
      </div>

      {/* Add tables */}
      <Card className="border-[#7c3aed]/20 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#7c3aed]" />
          <h3 className="font-semibold">เพิ่มโต๊ะใหม่</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-xs text-muted-foreground">จำนวน</label>
            <Input
              type="number"
              min={1}
              max={200}
              value={addCount}
              onChange={(e) => setAddCount(parseInt(e.target.value) || 1)}
              className="h-10 rounded-xl"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="mb-1 block text-xs text-muted-foreground">คำนำหน้า (optional)</label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="เช่น T, A"
              className="h-10 rounded-xl"
            />
          </div>
          <Button
            onClick={addTables}
            disabled={adding}
            className="h-10 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white shadow-md btn-premium"
          >
            {adding ? "กำลังเพิ่ม..." : `เพิ่ม ${addCount} โต๊ะ`}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">ระบบจะสร้างเลขโต๊ะอัตโนมัติ เช่น 1, 2, 3 หรือ T1, T2, T3</p>
      </Card>

      {/* Tables grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {tables.map((t) => {
          const occupied = t.orders.length > 0;
          const total = t.orders.reduce((s, o) => s + o.total, 0);
          return (
            <Card
              key={t.id}
              className={`group relative overflow-hidden border-2 transition-all ${
                !t.active
                  ? "border-dashed border-gray-300 bg-gray-50/50 opacity-60"
                  : occupied
                    ? "border-orange-300 bg-gradient-to-br from-orange-50 to-white shadow-md"
                    : "border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white hover:border-emerald-400 hover:shadow-md"
              }`}
            >
              {/* Status bar */}
              <div className={`h-1.5 w-full ${!t.active ? "bg-gray-300" : occupied ? "bg-gradient-to-r from-orange-400 to-amber-400" : "bg-gradient-to-r from-emerald-400 to-green-400"}`} />

              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">โต๊ะ</div>
                    <div className="text-2xl font-bold">{t.number}</div>
                    {t.name && <div className="text-xs text-muted-foreground">{t.name}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {occupied && (
                      <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                        ไม่ว่าง
                      </span>
                    )}
                    {!occupied && t.active && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        ว่าง
                      </span>
                    )}
                    {!t.active && (
                      <span className="rounded-full bg-gray-300 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        ปิด
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {t.capacity} ที่นั่ง
                </div>

                {occupied && (
                  <div className="mb-3 rounded-lg border border-orange-200 bg-white/60 p-2 text-xs">
                    <div className="font-semibold text-orange-700">{t.orders.length} ออเดอร์</div>
                    <div className="text-orange-600">฿{total.toLocaleString()}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setQrTable(t)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] hover:bg-[#7c3aed]/20"
                    title="QR Code"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingTable(t)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/70"
                    title="แก้ไข"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(t)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/70"
                    title={t.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteTable(t.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                    title="ลบ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* QR Modal */}
      {qrTable && (
        <QrModal table={qrTable} slug={slug} shopName={shopName} onClose={() => setQrTable(null)} onCopied={() => setCopied(true)} copied={copied} />
      )}

      {/* Edit Modal */}
      {editingTable && (
        <EditModal
          table={editingTable}
          onClose={() => setEditingTable(null)}
          onSave={(data) => saveEdit(editingTable, data)}
        />
      )}
    </div>
  );
}

function QrModal({ table, slug, shopName, onClose, onCopied, copied }: { table: Table; slug: string; shopName: string; onClose: () => void; onCopied: () => void; copied: boolean }) {
  const orderUrl = typeof window !== "undefined" ? `${window.location.origin}/order/${slug}?table=${table.number}` : `/order/${slug}?table=${table.number}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=2&data=${encodeURIComponent(orderUrl)}`;

  function copy() {
    navigator.clipboard?.writeText(orderUrl);
    onCopied();
    setTimeout(() => onCopied(), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-[#7c3aed]/20 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">QR Code — โต๊ะ {table.number}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-2xl border-2 border-dashed border-[#7c3aed]/30 bg-gradient-to-br from-white to-[#faf5ff] p-4">
          <img src={qrUrl} alt="QR" className="mx-auto h-64 w-64" />
        </div>
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold">{shopName}</div>
          <div className="text-xs text-muted-foreground">โต๊ะ {table.number}{table.name ? ` · ${table.name}` : ""}</div>
        </div>
        <div className="mt-4 rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-2">
          <code className="block break-all text-center text-[10px] text-[#5b21b6]">{orderUrl}</code>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={copy} variant="outline" className="flex-1 rounded-xl border-[#7c3aed]/30">
            {copied ? <><Check className="mr-2 h-4 w-4 text-emerald-500" />คัดลอกแล้ว</> : <><Copy className="mr-2 h-4 w-4" />คัดลอกลิงก์</>}
          </Button>
          <a
            href={qrUrl}
            download={`qr-table-${table.number}.png`}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-sm font-semibold text-white shadow-md hover:shadow-[#7c3aed]/40"
          >
            ดาวน์โหลด
          </a>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground">พิมพ์ติดโต๊ะ — ลูกค้าสแกนเพื่อเปิดเมนู + กรอกเลขโต๊ะอัตโนมัติ</p>
      </Card>
    </div>
  );
}

function EditModal({ table, onClose, onSave }: { table: Table; onClose: () => void; onSave: (data: Partial<Table>) => void }) {
  const [number, setNumber] = useState(table.number);
  const [name, setName] = useState(table.name || "");
  const [capacity, setCapacity] = useState(table.capacity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6">
        <h3 className="mb-4 font-semibold">แก้ไขโต๊ะ {table.number}</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">เลขโต๊ะ</label>
            <Input value={number} onChange={(e) => setNumber(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">ชื่อโต๊ะ (optional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น โต๊ะริมหน้าต่าง" className="h-10 rounded-xl" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">จำนวนที่นั่ง</label>
            <Input type="number" min={1} max={50} value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 4)} className="h-10 rounded-xl" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">ยกเลิก</Button>
          <Button onClick={() => onSave({ number, name: name || null, capacity })} className="flex-1 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white">
            บันทึก
          </Button>
        </div>
      </Card>
    </div>
  );
}
