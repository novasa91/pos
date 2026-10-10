"use client";
import { useRef, useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  X,
  FileSpreadsheet,
  Download,
} from "lucide-react";
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
import {
  createProduct,
  updateProduct,
  deleteProduct,
  importProductsCsv,
} from "./actions";

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
  imageUrl: string | null;
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
  const [importing, setImporting] = useState(false);
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
            <>
              <Button
                variant="outline"
                onClick={() => setImporting(true)}
                className="shrink-0"
              >
                <FileSpreadsheet className="mr-1 h-4 w-4" /> นำเข้า CSV
              </Button>
              <Button onClick={() => setCreating(true)} className="shrink-0">
                <Plus className="mr-1 h-4 w-4" /> {t.common.add}
              </Button>
            </>
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
            <Card key={p.id} className="overflow-hidden">
              {p.imageUrl ? (
                <div className="relative h-32 w-full bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-20 w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted text-muted-foreground/40">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    {p.sku && (
                      <div className="text-xs text-muted-foreground">
                        SKU: {p.sku}
                      </div>
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
              </div>
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
      <ImportDialog
        open={importing}
        onOpenChange={setImporting}
        onImported={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>(product?.imageUrl ?? "");
  const [categoryId, setCategoryId] = useState<string>(
    product?.categoryId ?? "",
  );

  function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ไฟล์ใหญ่เกิน 2 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("รองรับเฉพาะไฟล์รูปภาพ");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  }

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
          action={(fd) => {
            onSubmit(fd);
            // reset local state for next open
            setImageUrl(product?.imageUrl ?? "");
            setCategoryId(product?.categoryId ?? "");
          }}
          className="space-y-3"
        >
          {/* Image picker */}
          <div>
            <Label>รูปสินค้า</Label>
            <div className="mt-1 flex items-start gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                      title="ลบรูป"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  name="imageUrl"
                  placeholder="วาง URL รูปภาพ (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="mr-1 h-4 w-4" /> อัปโหลดรูป
                </Button>
                <p className="text-xs text-muted-foreground">
                  URL หรืออัปโหลด (สูงสุด 2 MB)
                </p>
              </div>
            </div>
          </div>

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
            <input type="hidden" name="categoryId" value={categoryId} />
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่">
                  {categoryId
                    ? categories.find((c) => c.id === categoryId)?.name ??
                      "เลือกหมวดหมู่"
                    : "เลือกหมวดหมู่"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ไม่ระบุ</SelectItem>
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

function ImportDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [filename, setFilename] = useState<string>("");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function readFile(file: File) {
    setFilename(file.name);
    const text = await file.text();
    setCsv(text);
  }

  async function submit() {
    if (!csv.trim()) {
      toast.error("ยังไม่มีข้อมูล CSV");
      return;
    }
    setBusy(true);
    try {
      const res = await importProductsCsv(csv, { updateExisting });
      const parts: string[] = [];
      if (res.added) parts.push(`เพิ่ม ${res.added}`);
      if (res.updated) parts.push(`อัปเดต ${res.updated}`);
      if (res.skipped) parts.push(`ข้าม ${res.skipped}`);
      if (parts.length === 0) parts.push("ไม่มีรายการใหม่");
      const errors = res.errors ?? [];
      if (errors.length) {
        toast.warning(`${parts.join(" / ")} — มีข้อผิดพลาด ${errors.length} รายการ`);
        console.warn("Import errors:", errors);
      } else {
        toast.success(parts.join(" / "));
      }
      onImported();
      onOpenChange(false);
      setCsv("");
      setFilename("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "นำเข้าไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function downloadSample() {
    const sample =
      "name,sku,barcode,price,cost,stock,category,imageUrl,description\n" +
      "กาแฟร้อน,DRK-001,8851234567890,45,15,100,เครื่องดื่ม,https://images.unsplash.com/photo-1509042239860-f550ce710b93,\n" +
      "ขนมปังกรอบ,SNK-001,8851234567891,25,8,150,ขนมขบเคี้ยว,,\n" +
      "สลัดผัก,FDM-002,8851234567892,89,30,25,อาหารสด,,";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>นำเข้าสินค้าจาก CSV</DialogTitle>
          <DialogDescription>
            อัปโหลดไฟล์ CSV หรือวางข้อความ แถวแรกต้องเป็นชื่อคอลัมน์
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) readFile(f);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1 h-4 w-4" /> เลือกไฟล์ CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={downloadSample}
              className="text-muted-foreground"
            >
              <Download className="mr-1 h-4 w-4" /> ดาวน์โหลดตัวอย่าง
            </Button>
            {filename && (
              <span className="self-center text-sm text-muted-foreground">
                {filename}
              </span>
            )}
          </div>

          <div>
            <Label>หรือวาง CSV ที่นี่</Label>
            <Textarea
              rows={8}
              placeholder="name,sku,barcode,price,cost,stock,category,imageUrl"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div className="font-semibold">คอลัมน์ที่รองรับ:</div>
            <div className="mt-1">
              <code>name</code> (ต้องมี), <code>sku</code>, <code>barcode</code>,{" "}
              <code>price</code>, <code>cost</code>, <code>stock</code>,{" "}
              <code>category</code> (สร้างใหม่อัตโนมัติ), <code>imageUrl</code>,{" "}
              <code>description</code>
            </div>
            <div className="mt-1">
              ถ้า <code>sku</code> ซ้ำ จะถูกข้าม (เปิด &quot;อัปเดตรายการเดิม&quot;
              เพื่อเขียนทับ)
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="h-4 w-4"
            />
            อัปเดตรายการเดิม (เมื่อ SKU ตรงกัน)
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            ยกเลิก
          </Button>
          <Button type="button" onClick={submit} disabled={busy || !csv.trim()}>
            {busy ? "กำลังนำเข้า..." : "นำเข้า"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
