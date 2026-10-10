"use client";

import { useState } from "react";
import { QrCode, Copy, Download, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QrCodeView({
  shopName,
  slug,
  origin,
}: {
  shopName: string;
  slug: string;
  origin: string;
}) {
  const [copied, setCopied] = useState(false);
  // origin is provided by the server so the URL is the same on both sides
  // (no hydration mismatch). Falls back to a relative path if absent.
  const orderUrl = origin
    ? `${origin}/order/${slug}`
    : `/order/${slug}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=2&data=${encodeURIComponent(orderUrl)}`;

  function copy() {
    navigator.clipboard?.writeText(orderUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qrcode-${slug}.png`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">QR Code สั่งอาหาร</h1>
        <p className="text-sm text-muted-foreground">ลูกค้าแสกน QR เพื่อเข้าหน้าสั่งอาหารได้ทันที</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Display */}
        <Card className="overflow-hidden border-[#7c3aed]/20">
          <div className="h-1 bg-gradient-to-r from-[#7c3aed] via-[#ec4899] to-[#06b6d4]" />
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center shadow-lg shadow-[#7c3aed]/30">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <h2 className="font-semibold">{shopName}</h2>
            <div className="rounded-2xl border-2 border-[#7c3aed]/10 bg-white p-4 shadow-inner">
              <img src={qrUrl} alt="QR Code" className="mx-auto h-64 w-64" />
            </div>
            <p className="text-xs text-muted-foreground">แสกนด้วยกล้องมือถือ หรือ LINE</p>
          </div>
        </Card>

        {/* URL + Actions */}
        <div className="space-y-4">
          <Card className="border-[#7c3aed]/20 p-6">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Smartphone className="h-4 w-4 text-[#7c3aed]" />
              ลิงก์สั่งอาหาร
            </h3>
            <div className="rounded-xl border border-[#e9d5ff] bg-[#faf5ff] p-3">
              <code className="break-all text-xs text-[#5b21b6]">{orderUrl}</code>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={copy} variant="outline" className="h-10 flex-1 rounded-xl border-[#7c3aed]/30 hover:bg-[#faf5ff]">
                {copied ? <><Check className="mr-2 h-4 w-4 text-emerald-500" />คัดลอกแล้ว</> : <><Copy className="mr-2 h-4 w-4" />คัดลอกลิงก์</>}
              </Button>
              <Button onClick={download} className="h-10 flex-1 rounded-xl bg-gradient-to-r from-[#5b21b6] to-[#7c3aed] text-white shadow-md btn-premium">
                <Download className="mr-2 h-4 w-4" />ดาวน์โหลด QR
              </Button>
            </div>
          </Card>

          <Card className="border-[#7c3aed]/20 bg-gradient-to-br from-[#faf5ff] to-white p-6">
            <h3 className="mb-2 font-semibold">💡 วิธีใช้งาน</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-[#7c3aed] font-bold">1.</span>พิมพ์ QR ติดที่โต๊ะหรือหน้าร้าน</li>
              <li className="flex gap-2"><span className="text-[#7c3aed] font-bold">2.</span>ลูกค้าแสกนเปิดเมนูบนมือถือ</li>
              <li className="flex gap-2"><span className="text-[#7c3aed] font-bold">3.</span>เลือกอาหาร + กรอกเลขโต๊ะ</li>
              <li className="flex gap-2"><span className="text-[#7c3aed] font-bold">4.</span>ออเดอร์เข้าครัว + แจ้ง LINE ทันที</li>
            </ol>
          </Card>
        </div>
      </div>

      {/* Print preview section */}
      <Card className="border-[#7c3aed]/20 p-6 print:hidden">
        <h3 className="mb-3 font-semibold">📋 ตัวอย่างเมื่อพิมพ์ติดโต๊ะ</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border-2 border-dashed border-[#7c3aed]/30 p-4 text-center">
              <div className="text-xs text-muted-foreground">โต๊ะ {i}</div>
              <img src={qrUrl} alt={`Table ${i}`} className="mx-auto my-2 h-32 w-32" />
              <div className="text-xs font-semibold text-[#7c3aed]">{shopName}</div>
              <div className="text-[10px] text-muted-foreground">สแกนเพื่อสั่งอาหาร</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          💡 พิมพ์ขนาด 8×8 ซม. ต่อโต๊ะ หรือใช้แผ่น A4 แบ่ง 6 ช่อง
        </p>
      </Card>
    </div>
  );
}
