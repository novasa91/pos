"use client";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";
import { createProduct, updateProduct, deleteProduct } from "./actions";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  trackStock: boolean;
};

type Category = { id: string; name: string };

export function ProductsClient({
  initialProducts,
  categories,
  canEdit,
}: {
  initialProducts: Product[];
  categories: Category[];
  canEdit: boolean;
}) {
  const t = useT();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = initialProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()),
  );

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        if (editing) {
          await updateProduct(editing.id, formData);
          toast.success("บันทึกแล้ว");
        } else {
          await createProduct(formData);
          toast.success("เพิ่มสินค้าแล้ว");
        }
        setEditing(null);
        setCreating(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function onDelete(p: Product) {
    if (!confirm(`ลบสินค้า "${p.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteProduct(p.id);
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
          <h1 className="text-2xl font-bold">{t.nav.products}</h1>
          <p className="text-sm text-muted-foreground">
            {initialProducts.length} รายการ
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.search}
              className="w-full pl-9 sm:w-64"
            />
          </div>
          {canEdit && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> {t.common.add}
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {t.common.noData}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  {p.sku && (
                    <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                  )}
                </div>
                {p.categoryName && (
                  <Badge variant="secondary" className="text-[10px]">
                    {p.categoryName}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary">
                  ฿{p.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </span>
                {p.trackStock && (
                  <span
                    className={`text-xs ${
                      p.stock <= p.lowStockThreshold
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {p.stock <= p.lowStockThreshold && (
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                    )}
                    คงเหลือ: {p.stock}
                  </span>
                )}
              </div>
              {canEdit && (
                <div className="mt-3 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditing(p)}
                  >
                    <Pencil className="mr-1 h-3 w-3" /> {t.common.edit}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(p)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ProductForm
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        product={editing}
        categories={categories}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </div>
  );
}

function ProductForm({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSubmit: (fd: FormData) => void;
  isPending: boolean;
}) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? `แก้ไขสินค้า` : `เพิ่มสินค้าใหม่`}
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลสินค้า กดบันทึกเมื่อเสร็จ
          </DialogDescription>
        </DialogHeader>
        <form
          action={onSubmit}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="name">{t.common.name} *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={product?.name}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sku">{t.common.sku}</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
            </div>
            <div>
              <Label htmlFor="barcode">{t.common.barcode}</Label>
              <Input
                id="barcode"
                name="barcode"
                defaultValue={product?.barcode ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="categoryId">{t.common.category}</Label>
            <Select
              name="categoryId"
              defaultValue={product?.categoryId ?? ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t.common.no}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">{t.common.price} *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={product?.price ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="cost">{t.common.cost}</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.cost ?? 0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stock">{t.common.stock}</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
              />
            </div>
            <div>
              <Label htmlFor="lowStockThreshold">แจ้งเตือนเมื่อต่ำกว่า</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                defaultValue={product?.lowStockThreshold ?? 5}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">{t.common.description}</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={product?.description ?? ""}
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                name="isActive"
                defaultChecked={product?.isActive ?? true}
              />
              ใช้งาน
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                name="trackStock"
                defaultChecked={product?.trackStock ?? true}
              />
              ตัดสต็อก
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isPending}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
