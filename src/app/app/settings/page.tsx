import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { updateSettings } from "./actions";
import { Card } from "@/components/ui/card";
import { TableProperties } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { can } from "@/lib/rbac";
import { Save } from "lucide-react";

export default async function SettingsPage() {
  const ctx = await requireTenant();
  const t = ctx.tenant;
  const canEdit = can(ctx.role, "settings.write");

  async function action(formData: FormData) {
    "use server";
    await updateSettings(formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าร้าน</h1>
        <p className="text-sm text-muted-foreground">
          ข้อมูลร้าน ภาษี และใบเสร็จ
        </p>
      </div>

      <form action={action} className="space-y-6">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">ข้อมูลร้าน</h2>
          <div>
            <Label htmlFor="name">ชื่อร้าน *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={t.name}
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="phone">โทรศัพท์</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={t.phone ?? ""}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={t.email ?? ""}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="taxId">เลขประจำตัวผู้เสียภาษี</Label>
            <Input
              id="taxId"
              name="taxId"
              defaultValue={t.taxId ?? ""}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="address">ที่อยู่</Label>
            <Textarea
              id="address"
              name="address"
              rows={2}
              defaultValue={t.address ?? ""}
              disabled={!canEdit}
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">ภาษี (VAT)</h2>
          <label className="flex items-center gap-3">
            <Switch
              name="vatEnabled"
              defaultChecked={t.vatEnabled}
              disabled={!canEdit}
            />
            <span>เปิดใช้ VAT 7%</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="vatRate">อัตราภาษี (%)</Label>
              <Input
                id="vatRate"
                name="vatRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={t.vatRate}
                disabled={!canEdit || !t.vatEnabled}
              />
            </div>
            <label className="flex items-end gap-3 pb-2">
              <Switch
                name="vatInclusive"
                defaultChecked={t.vatInclusive}
                disabled={!canEdit || !t.vatEnabled}
              />
              <span>ราคารวม VAT แล้ว</span>
            </label>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">ใบเสร็จ</h2>
          <div>
            <Label htmlFor="receiptHeader">หัวกระดาษใบเสร็จ</Label>
            <Textarea
              id="receiptHeader"
              name="receiptHeader"
              rows={2}
              defaultValue={t.receiptHeader ?? ""}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="receiptFooter">ท้ายกระดาษใบเสร็จ</Label>
            <Textarea
              id="receiptFooter"
              name="receiptFooter"
              rows={2}
              defaultValue={t.receiptFooter ?? ""}
              disabled={!canEdit}
            />
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">ภาษาและสกุลเงิน</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="locale">ภาษา</Label>
              <Select name="locale" defaultValue={t.locale} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="th">ไทย</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="currency">สกุลเงิน</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={t.currency}
                disabled={!canEdit}
              />
            </div>
          </div>
        </Card>

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              <Save className="mr-2 h-4 w-4" />
              บันทึก
            </Button>
          </div>
        )}
      </form>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/settings/qr"
          className="group flex items-center gap-4 rounded-2xl border border-[#7c3aed]/20 bg-gradient-to-br from-white to-[#faf5ff] p-5 transition-all hover:-translate-y-0.5 hover:border-[#7c3aed]/40 hover:shadow-lg hover:shadow-[#7c3aed]/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] shadow-md shadow-[#7c3aed]/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M21 14v3h-3"/><path d="M14 21h3"/></svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#5b21b6]">QR Code สั่งอาหาร</div>
            <div className="text-xs text-muted-foreground">ลูกค้าแสกนเพื่อเปิดเมนูบนมือถือ</div>
          </div>
          <svg className="h-5 w-5 text-[#7c3aed] transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link
          href="/app/settings/line"
          className="group flex items-center gap-4 rounded-2xl border border-[#06c755]/20 bg-gradient-to-br from-white to-[#f0fff4] p-5 transition-all hover:-translate-y-0.5 hover:border-[#06c755]/40 hover:shadow-lg hover:shadow-[#06c755]/10"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#06c755] to-[#00b900] shadow-md shadow-[#06c755]/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#065f46]">LINE Notify</div>
            <div className="text-xs text-muted-foreground">แจ้งเตือนออเดอร์เข้า LINE ทันที</div>
          </div>
          <svg className="h-5 w-5 text-[#06c755] transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link
          href="/app/settings/tables"
          className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-5 transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25">
            <TableProperties className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-900">จัดการโต๊ะ & QR</div>
            <div className="text-xs text-muted-foreground">สร้าง QR ต่อโต๊ะ คิดเงินแยกโต๊ะ</div>
          </div>
          <svg className="h-5 w-5 text-amber-500 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link
          href="/app/settings/lineman"
          className="group flex items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-200/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00c300] to-[#00a000] shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h3l3 6h-6"/><path d="M2 17.5h3.5M18.5 17.5H22"/></svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">Online Delivery</div>
            <div className="text-xs text-muted-foreground">เชื่อม Lineman, Grab, ShopeeFood</div>
          </div>
          <svg className="h-5 w-5 text-emerald-500 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
        <Link
          href="/app/settings/promptpay"
          className="group flex items-center gap-4 rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-[#eff6ff] p-5 transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-200/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-blue-900">PromptPay</div>
            <div className="text-xs text-muted-foreground">รับชำระผ่าน QR อัตโนมัติ</div>
          </div>
          <svg className="h-5 w-5 text-blue-500 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </Link>
      </div>
    </div>
  );
}
