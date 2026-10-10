"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Search, Plus, Minus, Trash2, User, X, CreditCard, Banknote, ArrowRightLeft, QrCode, CircleDot, CheckCircle2, Receipt as ReceiptIcon, Printer, Mail, ScanBarcode, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useT } from "@/components/locale-provider";
import { createSale, searchProducts, searchCustomers, type CreateSaleInput } from "./actions";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock: number;
  trackStock: boolean;
  categoryName: string | null;
  imageUrl: string | null;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  maxStock: number;
  trackStock: boolean;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  points: number;
};

type Payment = {
  method: "CASH" | "CARD" | "TRANSFER" | "PROMPTPAY" | "OTHER";
  amount: number;
  reference?: string;
};

export function PosTerminal({
  tenant,
  initialProducts,
}: {
  tenant: {
    id: string;
    name: string;
    currency: string;
    vatEnabled: boolean;
    vatRate: number;
    vatInclusive: boolean;
  };
  initialProducts: Product[];
}) {
  const t = useT();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activePaymentMethod, setActivePaymentMethod] = useState<Payment["method"]>("CASH");
  const [activePaymentAmount, setActivePaymentAmount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search products (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await searchProducts(search, 50);
      setProducts(
        res.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode,
          price: p.price,
          stock: p.stock,
          trackStock: p.trackStock,
          categoryName: p.category?.name ?? null,
          imageUrl: p.imageUrl,
        })),
      );
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Search customers
  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await searchCustomers(customerQuery);
      setCustomerResults(res);
    }, 200);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  // Auto-add scanned barcode (USB scanner types fast + Enter)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === searchInputRef.current) {
        const q = search.trim();
        if (q && /^\d{6,}$/.test(q)) {
          // Likely a barcode
          const p = products.find((x) => x.barcode === q);
          if (p) {
            addToCart(p);
            setSearch("");
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [search, products]);

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) {
        if (p.trackStock && existing.quantity >= p.stock) {
          toast.error(`${p.name}: ${t.pos.insufficientStock}`);
          return prev;
        }
        return prev.map((c) =>
          c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      if (p.trackStock && p.stock <= 0) {
        toast.error(`${p.name}: ${t.pos.insufficientStock}`);
        return prev;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          quantity: 1,
          discount: 0,
          maxStock: p.stock,
          trackStock: p.trackStock,
        },
      ];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty <= 0) return null;
          if (c.trackStock && newQty > c.maxStock) {
            toast.error(t.pos.insufficientStock);
            return c;
          }
          return { ...c, quantity: newQty };
        })
        .filter(Boolean) as CartItem[],
    );
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setCustomer(null);
    setOverallDiscount(0);
    setPayments([]);
  }

  // Price calculations
  const calc = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let total = 0;
    for (const item of cart) {
      const lineBase = item.price * item.quantity - item.discount;
      let lineSub: number, lineTax: number, lineTotal: number;
      if (tenant.vatEnabled && tenant.vatInclusive) {
        const r = tenant.vatRate / 100;
        lineTax = (lineBase * r) / (1 + r);
        lineSub = lineBase - lineTax;
        lineTotal = lineBase;
      } else if (tenant.vatEnabled) {
        lineSub = lineBase;
        lineTax = lineSub * (tenant.vatRate / 100);
        lineTotal = lineSub + lineTax;
      } else {
        lineSub = lineBase;
        lineTax = 0;
        lineTotal = lineBase;
      }
      subtotal += lineSub;
      tax += lineTax;
      total += lineTotal;
    }
    total = Math.max(0, total - overallDiscount);
    return {
      subtotal: round2(subtotal),
      tax: round2(tax),
      total: round2(total),
    };
  }, [cart, overallDiscount, tenant]);

  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const change = round2(paid - calc.total);
  const remaining = round2(calc.total - paid);

  function addPayment() {
    if (activePaymentAmount <= 0) {
      toast.error("กรุณาระบุจำนวนเงิน");
      return;
    }
    setPayments((prev) => [
      ...prev,
      { method: activePaymentMethod, amount: activePaymentAmount },
    ]);
    setActivePaymentAmount(0);
  }

  function removePayment(idx: number) {
    setPayments((prev) => prev.filter((_, i) => i !== idx));
  }

  function openPayment() {
    if (cart.length === 0) {
      toast.error(t.pos.cartEmpty);
      return;
    }
    setActivePaymentAmount(calc.total);
    setActivePaymentMethod("CASH");
    setPayments([]);
    setPaymentDialogOpen(true);
  }

  function completeSale() {
    if (payments.length === 0) {
      toast.error("กรุณาเพิ่มการชำระเงิน");
      return;
    }
    if (paid < calc.total) {
      toast.error("ยอดชำระไม่ครบ");
      return;
    }

    const input: CreateSaleInput = {
      customerId: customer?.id ?? null,
      items: cart.map((c) => ({
        productId: c.productId,
        price: c.price,
        quantity: c.quantity,
        discount: c.discount,
      })),
      discount: overallDiscount,
      payments,
      notes: undefined,
    };

    startTransition(async () => {
      try {
        const sale = await createSale(input);
        toast.success(t.pos.saleCompleted);
        setCompletedSale(sale);
        setPaymentDialogOpen(false);
        clearCart();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  function currencyFmt(n: number) {
    return `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left: Product search + grid */}
      <div className="flex flex-1 flex-col overflow-hidden border-r">
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.pos.searchPlaceholder}
              className="h-12 pl-10 pr-4 text-base"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            <ScanBarcode className="mr-1 inline h-3 w-3" />
            รองรับเครื่องสแกนบาร์โค้ด USB (Keyboard Wedge)
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t.pos.productNotFound}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group flex flex-col rounded-2xl border border-[#e9d5ff] bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#7c3aed]/50 hover:shadow-xl hover:shadow-[#7c3aed]/15 disabled:opacity-50 overflow-hidden"
                  style={{ animation: "scaleIn 0.25s var(--ease-spring) both" }}
                  disabled={p.trackStock && p.stock <= 0}
                >
                  {/* Product image */}
                  <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-[#faf5ff] to-[#f3e8ff]">
                    {"imageUrl" in p && p.imageUrl ? (
                      <img
                        src={p.imageUrl as string}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-4xl">
                          {{ "ส้มตำ": "🥗", "ลาบ": "🍖", "ข้าวเหนียว": "🍚", "เครื่องเคียง": "🥜", "น้ำปู": "🦀", "เครื่องดื่ม": "🥤" }[p.categoryName as string] ?? "🍽️"}
                        </span>
                      </div>
                    )}
                    {/* Stock overlay */}
                    {p.trackStock && (
                      <div className={`absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
                        p.stock <= 5 ? "bg-amber-500/90 text-white" : "bg-white/80 text-[#7c3aed]"
                      }`}>
                        {p.stock <= 0 ? "หมด" : `${p.stock} ชิ้น`}
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="w-full p-3">
                    <div className="mb-1 text-xs font-medium text-[#7c3aed]">{p.categoryName}</div>
                    <div className="mb-auto line-clamp-2 text-sm font-semibold leading-tight">{p.name}</div>
                    <div className="mt-2 text-lg font-bold bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] bg-clip-text text-transparent">
                      {currencyFmt(p.price)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="flex w-full flex-col bg-gradient-to-b from-white/50 to-muted/10 lg:w-[420px] glass">
        <div className="flex items-center justify-between border-b border-[#e2e8f0]/50 bg-white/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/10">
              <ShoppingCart className="h-4 w-4 text-[#7c3aed]" />
            </div>
            <h2 className="font-bold">{t.pos.cart}</h2>
            {cart.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-1.5 text-[10px] font-bold text-white shadow-sm">
                {cart.length}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <X className="mr-1 h-4 w-4" />
              {t.pos.clearCart}
            </Button>
          )}
        </div>

        {/* Customer */}
        <div className="border-b p-3">
          {!customer ? (
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <User className="h-4 w-4" />
                {t.pos.selectCustomer}
              </summary>
              <div className="mt-2 space-y-2">
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder={t.pos.selectCustomer}
                />
                <div className="max-h-32 overflow-y-auto rounded border bg-background">
                  {customerResults.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">{t.common.noData}</div>
                  ) : (
                    customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomer(c);
                          setCustomerQuery("");
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <div className="font-medium">{c.name}</div>
                        {c.phone && (
                          <div className="text-xs text-muted-foreground">{c.phone}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </details>
          ) : (
            <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
              <div>
                <div className="text-sm font-medium">{customer.name}</div>
                {customer.phone && (
                  <div className="text-xs text-muted-foreground">{customer.phone}</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCustomer(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {t.pos.cartEmpty}
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <Card key={item.productId} className="border-[#e2e8f0] bg-white/80 p-3 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {currencyFmt(item.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {currencyFmt(item.price * item.quantity - item.discount)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => updateQty(item.productId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => updateQty(item.productId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t bg-background p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>{t.pos.subtotal}</span>
              <span>{currencyFmt(calc.subtotal)}</span>
            </div>
            {overallDiscount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t.pos.discount}</span>
                <span>-{currencyFmt(overallDiscount)}</span>
              </div>
            )}
            {tenant.vatEnabled && calc.tax > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {t.pos.tax} ({tenant.vatRate}%)
                </span>
                <span>{currencyFmt(calc.tax)}</span>
              </div>
            )}
          </div>
          <Separator className="my-2" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">{t.pos.total}</span>
            <span className="text-2xl font-bold text-primary">
              {currencyFmt(calc.total)}
            </span>
          </div>
          <Button
            className="mt-4 h-12 w-full text-base rounded-2xl font-bold bg-gradient-to-r from-[#5b21b6] via-[#7c3aed] to-[#ec4899] text-white shadow-xl shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50 hover:brightness-110 btn-premium transition-all"
            onClick={openPayment}
            disabled={cart.length === 0}
          >
            {t.pos.pay} <ArrowRightLeft className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.pos.pay}</DialogTitle>
            <DialogDescription>
              {t.pos.total}: {currencyFmt(calc.total)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  { m: "CASH", label: t.pos.cash, icon: Banknote },
                  { m: "CARD", label: t.pos.card, icon: CreditCard },
                  { m: "TRANSFER", label: t.pos.transfer, icon: ArrowRightLeft },
                  { m: "PROMPTPAY", label: t.pos.promptpay, icon: QrCode },
                  { m: "OTHER", label: t.pos.other, icon: CircleDot },
                ] as const
              ).map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.m}
                    onClick={() => setActivePaymentMethod(pm.m)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition-colors ${
                      activePaymentMethod === pm.m
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {pm.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-sm font-medium">จำนวนเงิน</label>
              <Input
                type="number"
                value={activePaymentAmount || ""}
                onChange={(e) => setActivePaymentAmount(parseFloat(e.target.value) || 0)}
                className="mt-1 h-12 text-lg"
                autoFocus
              />
              {activePaymentMethod === "CASH" && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    calc.total,
                    Math.ceil(calc.total / 100) * 100,
                    Math.ceil(calc.total / 500) * 500,
                    Math.ceil(calc.total / 1000) * 1000,
                  ]
                    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
                    .map((v) => (
                      <Button
                        key={v}
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePaymentAmount(v)}
                      >
                        {currencyFmt(v)}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            <Button onClick={addPayment} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มการชำระ
            </Button>

            {payments.length > 0 && (
              <div className="space-y-2 rounded border bg-muted/30 p-3">
                {payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{paymentLabel(p.method, t)}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currencyFmt(p.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removePayment(i)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>{t.pos.paid}</span>
                  <span>{currencyFmt(paid)}</span>
                </div>
                {change > 0 && (
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>{t.pos.change}</span>
                    <span>{currencyFmt(change)}</span>
                  </div>
                )}
                {remaining > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>คงเหลือ</span>
                    <span>{currencyFmt(remaining)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={completeSale} disabled={isPending || paid < calc.total}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {t.pos.completeSale}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!completedSale} onOpenChange={(o) => !o && setCompletedSale(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {t.pos.saleCompleted}
            </DialogTitle>
            <DialogDescription>
              เลขที่ใบเสร็จ: <code className="text-xs">{completedSale?.receiptNo}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between">
              <span>{t.pos.total}</span>
              <span className="font-semibold">
                {currencyFmt(completedSale?.total ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t.pos.paid}</span>
              <span>{currencyFmt(completedSale?.paid ?? 0)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>{t.pos.change}</span>
              <span>{currencyFmt(completedSale?.change ?? 0)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="mr-2 h-4 w-4" />
              {t.pos.printReceipt}
            </Button>
            <Button onClick={() => setCompletedSale(null)}>
              {t.pos.newSale}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function paymentLabel(m: Payment["method"], t: any): string {
  return (
    {
      CASH: t.pos.cash,
      CARD: t.pos.card,
      TRANSFER: t.pos.transfer,
      PROMPTPAY: t.pos.promptpay,
      OTHER: t.pos.other,
    } as Record<Payment["method"], string>
  )[m];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
