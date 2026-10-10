"use client";

import { useState } from "react";
import { Bell, Check, AlertCircle, MessageCircle, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function LineSettings({
  initialToken,
  initialEnabled,
}: {
  initialToken: string | null;
  initialEnabled: boolean;
}) {
  const [token, setToken] = useState(initialToken ?? "");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/settings/line-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lineNotifyToken: token, lineNotifyEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function testMessage() {
    if (!token) {
      setError("กรอก Token ก่อน");
      return;
    }
    setTesting(true);
    setTestResult(null);
    setError("");
    try {
      const res = await fetch("https://notify-api.line.me/api/notify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          message: "✅ ทดสอบแจ้งเตือนจาก POS Cloud — ใช้งานได้แล้ว!",
        }).toString(),
      });
      if (res.ok) {
        setTestResult("ok");
      } else {
        setTestResult("fail");
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Token ไม่ถูกต้อง");
      }
    } catch (e) {
      setTestResult("fail");
      setError(String(e));
    } finally {
      setTesting(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
        <p className="text-sm text-muted-foreground">
          ตั้งค่า LINE Notify ให้แจ้งเตือนออเดอร์ใหม่เข้ามือถือทันที
        </p>
      </div>

      {/* Main LINE Notify card */}
      <Card className="overflow-hidden border-[#7c3aed]/20">
        <div className="h-1 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#06b6d4]" />
        <div className="space-y-5 p-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#06c755] to-[#00b900] shadow-lg">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">LINE Notify</h2>
              <p className="text-xs text-muted-foreground">ส่งข้อความแจ้งเตือนเข้า LINE ส่วนตัวหรือกลุ่ม</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-xs font-medium ${enabled ? "text-emerald-500" : "text-muted-foreground"}`}>
                {enabled ? "เปิดใช้งาน" : "ปิด"}
              </span>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className={`relative h-6 w-11 rounded-full transition-all ${
                  enabled ? "bg-gradient-to-r from-[#7c3aed] to-[#ec4899]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-all ${
                    enabled ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Token input */}
          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">
              LINE Notify Token
            </Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="วาง Token ที่ได้จาก https://notify-bot.line.me/"
              className="h-10 rounded-xl border-[#e9d5ff] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Token จะถูกเก็บเข้ารหัสและใช้เฉพาะส่งแจ้งเตือนออเดอร์เท่านั้น
            </p>
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
              บันทึกเรียบร้อย
            </div>
          )}
          {testResult === "ok" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 animate-fade-in-up">
              <Check className="h-4 w-4" />
              ส่งข้อความทดสอบสำเร็จ! เช็ค LINE ของคุณ
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-10 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] font-semibold text-white shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/40 btn-premium"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testMessage}
              disabled={testing || !token}
              className="h-10 rounded-xl border-[#06c755] text-[#06b755] hover:bg-[#06c755]/10"
            >
              <Bell className="mr-2 h-4 w-4" />
              {testing ? "กำลังส่ง..." : "ทดสอบส่ง"}
            </Button>
          </div>
        </div>
      </Card>

      {/* How to get token */}
      <Card className="border-[#7c3aed]/20 bg-gradient-to-br from-[#faf5ff] to-white p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed] text-xs text-white">?</span>
          วิธีขอ Token (ฟรี)
        </h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">1</span>
            <div className="flex-1">
              <p>เข้า <a href="https://notify-bot.line.me/" target="_blank" className="inline-flex items-center gap-1 font-semibold text-[#7c3aed] hover:underline">https://notify-bot.line.me/<ExternalLink className="h-3 w-3" /></a> แล้ว login ด้วย LINE</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">2</span>
            <p>คลิก <strong>"Generate token"</strong> ในเมนู My page</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">3</span>
            <p>ตั้งชื่อ token (เช่น "POS Cloud - ร้านส้มตำ") และเลือกกลุ่มที่จะให้แจ้งเตือน (แนะนำให้สร้างกลุ่ม "ออเดอร์ร้าน" แยก)</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">4</span>
            <p>คัดลอก Token มาวางในช่องด้านบน แล้วกด "ทดสอบส่ง" เพื่อยืนยัน</p>
          </li>
        </ol>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          💡 <strong>Tip:</strong> สร้างกลุ่ม LINE แยกสำหรับพนักงานในร้าน แล้ว invite LINE Notify เข้ากลุ่ม จะได้แจ้งเตือนทันทีทุกครั้งที่มีออเดอร์
        </div>
      </Card>

      {/* Message preview */}
      <Card className="border-[#7c3aed]/20 p-6">
        <h3 className="mb-3 font-semibold">ตัวอย่างข้อความที่จะได้รับ</h3>
        <div className="rounded-2xl border border-[#06c755]/20 bg-gradient-to-br from-[#f0fff4] to-white p-4 font-mono text-sm shadow-sm">
          <pre className="whitespace-pre-wrap leading-relaxed text-gray-700">
{`🔔 ออเดอร์ใหม่ #O141065
🏪 ส้มตำลุงสมชาย
🪑 โต๊ะ 3

📋 รายการ
  • ส้มตำกุ้ง ×1  ฿60
  • ลาบวัว ×1  ฿70
  • ข้าวเหนียวหมูแดง ×1  ฿50
  • น้ำเปล่า ×1  ฿10

💰 รวม ฿190
🔗 https://pos-ochre-one.vercel.app/kitchen`}
          </pre>
        </div>
      </Card>
    </div>
  );
}
