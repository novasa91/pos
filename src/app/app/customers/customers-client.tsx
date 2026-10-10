"use client";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCustomer, updateCustomer, deleteCustomer } from "./actions";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisitAt: Date | string | null;
};

export function CustomersClient({
  initialCustomers,
  canEdit,
  canDelete,
}: {
  initialCustomers: Customer[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = initialCustomers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (editing) {
          await updateCustomer(editing.id, formData);
          toast.success("บันทึกแล้ว");
        } else {
          await createCustomer(formData);
          toast.success("เพิ่มลูกค้าแล้ว");
        }
        setEditing(null);
        setCreating(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete(c: Customer) {
    if (!confirm(`ลบลูกค้า "${c.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCustomer(c.id);
        toast.success("ลบแล้ว");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">ลูกค้า</h1>
          <p className="text-sm text-muted-foreground">
            {initialCustomers.length} คน
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ เบอร์โทร อีเมล"
              className="w-full pl-9 sm:w-64"
            />
          </div>
          {canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> เพิ่มลูกค้า
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">ยังไม่มีลูกค้า</Card>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">ชื่อ</th>
                <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">เบอร์โทร</th>
                <th className="hidden px-4 py-2 text-left font-medium md:table-cell">อีเมล</th>
                <th className="hidden px-4 py-2 text-right font-medium md:table-cell">แต้ม</th>
                <th className="px-4 py-2 text-right font-medium">ยอดซื้อ</th>
                <th className="px-4 py-2 text-right font-medium">การกระทำ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="hidden px-4 py-2 sm:table-cell">{c.phone ?? "—"}</td>
                  <td className="hidden px-4 py-2 md:table-cell">{c.email ?? "—"}</td>
                  <td className="hidden px-4 py-2 text-right md:table-cell">{c.points}</td>
                  <td className="px-4 py-2 text-right">
                    ฿{c.totalSpent.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(c)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(c)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}</DialogTitle>
          </DialogHeader>
          <form action={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">ชื่อ *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={editing?.name}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">เบอร์โทร</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editing?.phone ?? ""}
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editing?.email ?? ""}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={editing?.address ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="points">แต้มสะสม</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="0"
                defaultValue={editing?.points ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={editing?.notes ?? ""}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
