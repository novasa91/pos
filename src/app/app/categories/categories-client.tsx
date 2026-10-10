"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createCategory, deleteCategory } from "../products/actions";

type Category = { id: string; name: string; color: string | null };

export function CategoriesClient({
  initialCategories,
  canEdit,
}: {
  initialCategories: Category[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await createCategory(formData);
        toast.success("เพิ่มหมวดหมู่แล้ว");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete(c: Category) {
    if (!confirm(`ลบหมวดหมู่ "${c.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(c.id);
        toast.success("ลบแล้ว");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">หมวดหมู่สินค้า</h1>
          <p className="text-sm text-muted-foreground">
            {initialCategories.length} หมวดหมู่
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> เพิ่มหมวดหมู่
          </Button>
        )}
      </div>

      {initialCategories.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">ยังไม่มีหมวดหมู่</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {initialCategories.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                {c.color && (
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                )}
                <span className="font-medium">{c.name}</span>
              </div>
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(c)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
          </DialogHeader>
          <form action={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
              <Input id="name" name="name" required autoFocus />
            </div>
            <div>
              <Label htmlFor="color">สี (ไม่บังคับ)</Label>
              <Input id="color" name="color" type="color" defaultValue="#3b82f6" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
