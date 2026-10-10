"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CancelButton() {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    if (!confirm("ยกเลิกการสมัคร? ระบบจะหยุดให้บริการเมื่อสิ้นสุดรอบบิลปัจจุบัน")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        toast.success("ยกเลิกแล้ว จะสิ้นสุดเมื่อครบรอบบิล");
        location.reload();
      } else if (data.error) {
        toast.error(data.error);
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <Button variant="outline" onClick={onClick} disabled={loading}>
      ยกเลิกการสมัคร
    </Button>
  );
}
