"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, User, X, KeyRound, Phone, Mail, UserCog, ShieldCheck, ShoppingCart, ChefHat, Power, PowerOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Employee = {
  id: string;
  name: string;
  nickname: string | null;
  role: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
};

const ROLES = [
  { id: "OWNER", label: "เจ้าของ", color: "from-purple-500 to-pink-500", icon: ShieldCheck, desc: "สิทธิ์เต็ม จัดการร้านได้ทุกอย่าง" },
  { id: "MANAGER", label: "ผู้จัดการ", color: "from-blue-500 to-cyan-500", icon: UserCog, desc: "จัดการสินค้า พนักงาน ดูรายงาน" },
  { id: "CASHIER", label: "แคชเชียร์", color: "from-emerald-500 to-green-500", icon: ShoppingCart, desc: "ขายหน้าร้าน รับชำระเงิน" },
  { id: "KITCHEN", label: "ครัว", color: "from-orange-500 to-amber-500", icon: ChefHat, desc: "ดูออเดอร์ในครัว ทำอาหาร" },
];

const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]));

export function EmployeesView({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [adding, setAdding] = useState(false);

  async function refresh() {
    const res = await fetch("/api/employees");
    if (res.ok) {
      const data = await res.json();
      setEmployees(data.employees);
    }
  }

  async function save(data: Partial<Employee> & { pin?: string }) {
    if (editing) {
      await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...data }),
      });
    } else {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setEditing(null);
    setAdding(false);
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("ลบพนักงานนี้?")) return;
    await fetch("/api/employees", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await refresh();
  }

  async function toggleActive(e: Employee) {
    await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: e.id, active: !e.active }),
    });
    await refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">พนักงาน</h1>
          <p className="text-sm text-muted-foreground">จัดการพนักงาน กำหนด role และ PIN สำหรับ login</p>
        </div>
        <Button
          onClick={() => setAdding(true)}
          className="h-10 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white shadow-md btn-premium"
        >
          <Plus className="mr-2 h-4 w-4" /> เพิ่มพนักงาน
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="flex items-center gap-2 rounded-xl border bg-white/60 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${r.color} shadow`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="truncate text-[10px] text-muted-foreground">{r.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Employees grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-[#e9d5ff] bg-white/40 p-10 text-center">
            <User className="mx-auto mb-2 h-12 w-12 text-[#7c3aed]/30" />
            <p className="text-sm text-muted-foreground">ยังไม่มีพนักงาน — กด "เพิ่มพนักงาน" เพื่อเริ่มต้น</p>
          </div>
        )}
        {employees.map((e) => {
          const role = ROLE_MAP[e.role] || ROLE_MAP.CASHIER;
          const Icon = role.icon;
          return (
            <Card
              key={e.id}
              className={`relative overflow-hidden border-2 transition-all ${
                e.active
                  ? "border-[#e9d5ff] bg-white hover:border-[#7c3aed]/40 hover:shadow-md"
                  : "border-dashed border-gray-300 bg-gray-50/50 opacity-60"
              }`}
            >
              <div className={`h-1.5 w-full bg-gradient-to-r ${role.color}`} />
              <div className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${role.color} shadow`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-bold">{e.name}</div>
                    {e.nickname && <div className="truncate text-xs text-muted-foreground">"{e.nickname}"</div>}
                    <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#faf5ff] px-2 py-0.5 text-[10px] font-bold text-[#5b21b6]">
                      {role.label}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  {e.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {e.phone}</div>}
                  {e.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {e.email}</div>}
                  <div className="flex items-center gap-1">
                    <KeyRound className="h-3 w-3" /> PIN: ●●●● (เข้ารหัส)
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  <button
                    onClick={() => setEditing(e)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/70"
                    title="แก้ไข"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => toggleActive(e)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted hover:bg-muted/70"
                    title={e.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  >
                    {e.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => remove(e.id)}
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

      {(adding || editing) && (
        <EmployeeForm
          employee={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function EmployeeForm({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (data: Partial<Employee> & { pin?: string }) => void;
}) {
  const [name, setName] = useState(employee?.name || "");
  const [nickname, setNickname] = useState(employee?.nickname || "");
  const [role, setRole] = useState(employee?.role || "CASHIER");
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [active, setActive] = useState(employee?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) {
      setError("กรุณาใส่ชื่อ");
      return;
    }
    if (!employee && (!pin || !/^\d{4,6}$/.test(pin))) {
      setError("PIN ต้องเป็นตัวเลข 4-6 หลัก");
      return;
    }
    if (pin && !/^\d{4,6}$/.test(pin)) {
      setError("PIN ต้องเป็นตัวเลข 4-6 หลัก");
      return;
    }
    setSaving(true);
    try {
      const data: any = { name, nickname: nickname || null, role, phone: phone || null, email: email || null, active };
      if (pin) data.pin = pin;
      await onSave(data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-[#7c3aed]/20 p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">{employee ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}</h3>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <Label>ชื่อ-นามสกุล *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="นายสมชาย ใจดี" className="mt-1 h-10 rounded-xl" />
          </div>
          <div>
            <Label>ชื่อเล่น</Label>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="ชาย" className="mt-1 h-10 rounded-xl" />
          </div>
          <div>
            <Label>ตำแหน่ง *</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                      active
                        ? "border-[#7c3aed] bg-gradient-to-br from-[#faf5ff] to-white shadow-sm"
                        : "border-[#e9d5ff] hover:border-[#7c3aed]/40"
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${r.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>PIN {employee ? "(เว้นว่างไว้ถ้าไม่เปลี่ยน)" : "*"}</Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••"
              maxLength={6}
              className="mt-1 h-10 rounded-xl font-mono text-lg tracking-widest"
            />
            <p className="mt-1 text-xs text-muted-foreground">4-6 หลัก — ใช้ login POS แทนรหัสผ่าน</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>โทรศัพท์</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812345678" className="mt-1 h-10 rounded-xl" />
            </div>
            <div>
              <Label>อีเมล</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="staff@shop.com" className="mt-1 h-10 rounded-xl" />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-[#faf5ff] p-3">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded accent-[#7c3aed]" />
            <span className="text-sm font-medium">ใช้งานอยู่</span>
          </label>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl">ยกเลิก</Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white btn-premium"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
