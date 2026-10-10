"use client";

import { useState } from "react";
import { Bike, Copy, Check, ExternalLink, Webhook, Code, Bell, FileText, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LinemanSettings({ slug, shopName }: { slug: string; shopName: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://pos-cloud.vercel.app";
  const webhookUrl = `${baseUrl}/api/delivery`;
  const samplePayload = `{
  "orderId": "LM123456",
  "restaurantId": "${slug}",
  "customer": {
    "name": "คุณสมชาย ใจดี",
    "phone": "0812345678",
    "address": "123/45 ถ.สีลม แขวงสีลม เขตบางรัก กทม. 10500"
  },
  "items": [
    { "productId": "p1", "name": "ส้มตำไทย", "qty": 1, "price": 50 },
    { "productId": "p2", "name": "ข้าวเหนียว", "qty": 1, "price": 15 }
  ],
  "subtotal": 65,
  "deliveryFee": 30,
  "total": 95,
  "note": "ไม่เผ็ด",
  "source": "LINEMAN"
}`;

  function copy(text: string, id: string) {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Online Delivery</h1>
        <p className="text-sm text-muted-foreground">
          เชื่อมต่อร้านกับ Lineman, GrabFood, ShopeeFood และแพลตฟอร์มอื่นๆ — รับออเดอร์เข้าครัวอัตโนมัติ
        </p>
      </div>

      {/* Supported platforms */}
      <Card className="border-[#7c3aed]/20 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Bike className="h-5 w-5 text-[#7c3aed]" />
          รองรับแพลตฟอร์ม
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { name: "LINE MAN", color: "from-[#00c300] to-[#00a000]", icon: "🛵" },
            { name: "GrabFood", color: "from-[#00b14f] to-[#008c3d]", icon: "🛵" },
            { name: "ShopeeFood", color: "from-[#ee4d2d] to-[#cc3a1a]", icon: "🛵" },
            { name: "Foodpanda", color: "from-[#d70f64] to-[#a0094a]", icon: "🐼" },
          ].map((p) => (
            <div key={p.name} className="rounded-xl border border-[#e9d5ff] bg-white p-3 text-center">
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-xl shadow`}>
                {p.icon}
              </div>
              <div className="text-xs font-semibold">{p.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Webhook setup */}
      <Card className="overflow-hidden border-emerald-200">
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Webhook className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Webhook URL สำหรับรับออเดอร์</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            นำ URL นี้ไปตั้งในระบบหลังบ้านของ Lineman/Grab/ShopeeFood เพื่อส่งออเดอร์เข้ามา
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              {webhookUrl}
            </code>
            <Button onClick={() => copy(webhookUrl, "webhook")} variant="outline" className="border-emerald-300">
              {copied === "webhook" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card className="border-[#7c3aed]/20 bg-gradient-to-br from-white to-[#faf5ff] p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold">
          <Code className="h-5 w-5 text-[#7c3aed]" />
          วิธีเชื่อมต่อ
        </h3>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">1</span>
            <div>
              <p>ติดต่อ <a href="https://www.linemanwongnok.com/" target="_blank" className="font-semibold text-[#7c3aed] hover:underline">Lineman for Business<ExternalLink className="inline h-3 w-3" /></a> เพื่อสมัครเป็นร้านค้า</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">2</span>
            <p>ขอ API Key จาก Lineman</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">3</span>
            <p>ตั้งค่า Webhook ในระบบ Lineman → ใส่ URL ด้านบน + ใส่ API Key ใน Header <code className="rounded bg-[#7c3aed]/10 px-1">x-api-key</code></p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/15 text-xs font-bold text-[#7c3aed]">4</span>
            <p>เมื่อมีออเดอร์จาก Lineman → เข้าครัวอัตโนมัติ + แจ้ง LINE ทันที</p>
          </li>
        </ol>
      </Card>

      {/* Sample payload */}
      <Card className="border-[#7c3aed]/20 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <FileText className="h-5 w-5 text-[#7c3aed]" />
            ตัวอย่าง JSON Payload
          </h3>
          <Button onClick={() => copy(samplePayload, "payload")} variant="outline" size="sm" className="border-[#7c3aed]/30">
            {copied === "payload" ? <><Check className="mr-2 h-3.5 w-3.5 text-emerald-500" />คัดลอกแล้ว</> : <><Copy className="mr-2 h-3.5 w-3.5" />คัดลอก</>}
          </Button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-xl border border-[#e9d5ff] bg-slate-900 p-4 text-xs text-emerald-300">
{samplePayload}
        </pre>
      </Card>

      {/* Test simulator */}
      <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 p-6">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-orange-900">
          <Play className="h-5 w-5 text-orange-600" />
          ทดสอบส่งออเดอร์
        </h3>
        <p className="mb-3 text-sm text-muted-foreground">ทดสอบโดยกดปุ่มด้านล่าง — ระบบจะสร้างออเดอร์จำลองเข้าครัวทันที</p>
        <Button
          onClick={async () => {
            const res = await fetch("/api/delivery", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: `TEST${Date.now().toString().slice(-6)}`,
                restaurantId: slug,
                customer: { name: "ลูกค้าทดสอบ", phone: "0899999999", address: "123 ถ.ทดสอบ" },
                items: [
                  { productId: "test1", name: "ส้มตำไทย", qty: 1, price: 50 },
                  { productId: "test2", name: "ข้าวเหนียว", qty: 1, price: 15 },
                ],
                subtotal: 65, deliveryFee: 30, total: 95, note: "ทดสอบระบบ", source: "LINEMAN",
              }),
            });
            const data = await res.json();
            if (data.success) {
              alert(`✅ ส่งออเดอร์ทดสอบสำเร็จ: ${data.orderId}\nเปิดหน้า /kitchen เพื่อดู`);
            } else {
              alert("❌ Error: " + data.error);
            }
          }}
          className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md btn-premium"
        >
          <Play className="mr-2 h-4 w-4" />
          ส่งออเดอร์ทดสอบ
        </Button>
      </Card>

      {/* Quick links */}
      <Card className="border-[#7c3aed]/20 p-6">
        <h3 className="mb-3 font-semibold">เมนูที่เกี่ยวข้อง</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href="/kitchen" target="_blank" className="flex items-center gap-2 rounded-xl border bg-white p-3 hover:border-[#7c3aed]">
            <Bike className="h-4 w-4 text-[#7c3aed]" />
            <div className="flex-1">
              <div className="text-sm font-semibold">ดูครัว KDS</div>
              <div className="text-xs text-muted-foreground">ออเดอร์ delivery จะเข้าที่นี่</div>
            </div>
          </a>
          <a href="/app/settings/line" className="flex items-center gap-2 rounded-xl border bg-white p-3 hover:border-[#06c755]">
            <Bell className="h-4 w-4 text-[#06c755]" />
            <div className="flex-1">
              <div className="text-sm font-semibold">ตั้ง LINE Notify</div>
              <div className="text-xs text-muted-foreground">แจ้งเตือนออเดอร์ delivery ทันที</div>
            </div>
          </a>
        </div>
      </Card>
    </div>
  );
}
