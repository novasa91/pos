"use client";

import { useState } from "react";
import { Wallet, Check, AlertCircle, Smartphone, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { buildPromptPayQR } from "@/lib/promptpay";

export function PromptpaySettings({
  initialPhone,
  initialName,
  shopName,
}: {
  initialPhone: string;
  initialName: string;
  shopName: string;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Test QR with 100 baht
  const testQrPayload = phone ? buildPromptPayQR(phone, 100) : "";
  const testQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=2&data=${encodeURIComponent(testQrPayload)}`;

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/settings/promptpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptpayPhone: phone, promptpayName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "บันทึกไม่สำเร็จ");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const clean = phone.replace(/[^0-9]/g, "");
  const validPhone = clean.length === 10 || clean.length === 13;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">PromptPay</h1>
        <p className="text-sm text-muted-foreground">
          ตั้งค่าบัญชี PromptPay เพื่อรับชำระเงินจากลูกค้า — QR จะถูกสร้างอัตโนมัติ
        </p>
      </div>

      {/* Main card */}
      <Card className="overflow-hidden border-[#7c3aed]/20">
        <div className="h-1 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#06b6d4]" />
        <div className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">บัญชี PromptPay ของร้าน</h2>
              <p className="text-xs text-muted-foreground">ระบบจะสร้าง QR ให้ลูกค้าสแกนจ่ายเงินอัตโนมัติ</p>
            </div>
          </div>

          {/* Phone / Tax ID input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              เบอร์โทรศัพท์ หรือ เลขประจำตัวผู้เสียภาษี
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812345678 หรือ 1234567890123"
              className="h-10 rounded-xl border-[#e9d5ff] font-mono text-sm"
              maxLength={13}
            />
            <p className="text-xs text-muted-foreground">
              {validPhone ? (
                <span className="text-emerald-600">✅ รูปแบบถูกต้อง ({clean.length} หลัก)</span>
              ) : phone ? (
                <span className="text-amber-600">⚠️ ใส่เบอร์ 10 หลัก หรือเลขผู้เสียภาษี 13 หลัก</span>
              ) : (
                <span>เบอร์มือถือ 10 หลัก หรือเลขผู้เสียภาษี 13 หลัก</span>
              )}
            </p>
          </div>

          {/* Account name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              ชื่อบัญชี <span className="text-xs text-muted-foreground">(ไม่บังคับ ใช้แสดงในใบเสร็จ)</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={shopName}
              className="h-10 rounded-xl border-[#e9d5ff]"
            />
          </div>

          {/* Status messages */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 animate-fade-in-up">
              <Check className="h-4 w-4" />
              บันทึกเรียบร้อย! QR จะถูกสร้างอัตโนมัติเมื่อลูกค้าสั่งอาหาร
            </div>
          )}

          <Button
            type="button"
            onClick={save}
            disabled={saving || !validPhone}
            className="h-10 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] font-semibold text-white shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40 btn-premium"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </Card>

      {/* Test QR */}
      {validPhone && (
        <Card className="border-[#7c3aed]/20 bg-gradient-to-br from-[#faf5ff] to-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <TestTube className="h-5 w-5 text-[#7c3aed]" />
            <h3 className="font-semibold">ทดสอบ QR</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            สแกน QR ด้วยแอปธนาคารเพื่อทดสอบ (จำนวน ฿100)
          </p>
          <div className="rounded-2xl border-2 border-dashed border-[#7c3aed]/30 bg-white p-4">
            <img src={testQrImageUrl} alt="Test QR" className="mx-auto h-64 w-64" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e9d5ff] bg-white p-3">
              <div className="text-xs text-muted-foreground">เบอร์</div>
              <div className="font-mono font-bold text-[#5b21b6]">
                {clean.length === 10
                  ? clean.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
                  : clean}
              </div>
            </div>
            <div className="rounded-xl border border-[#e9d5ff] bg-white p-3">
              <div className="text-xs text-muted-foreground">จำนวน</div>
              <div className="font-bold text-[#5b21b6]">฿100.00</div>
            </div>
          </div>
        </Card>
      )}

      {/* How it works */}
      <Card className="border-[#7c3aed]/20 bg-gradient-to-br from-white to-[#faf5ff] p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Smartphone className="h-4 w-4 text-[#7c3aed]" />
          วิธีการทำงาน
        </h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">1</span>
            <p>ลูกค้าสั่งอาหารผ่าน tablet/มือถือ → กด "ส่งออเดอร์"</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">2</span>
            <p>ระบบ redirect ไปหน้าชำระเงิน → <strong>สร้าง QR PromptPay อัตโนมัติ</strong> จากเบอร์ของร้าน + ยอดเงินจริง</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">3</span>
            <p>ลูกค้าเปิดแอปธนาคาร → สแกน QR → ยืนยันการโอน</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">4</span>
            <p>ระบบตรวจสอบสถานะทุก 3 วินาที → เมื่อชำระสำเร็จ → ส่งเข้าครัวทันที</p>
          </li>
        </ol>
      </Card>
    </div>
  );
}
