"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CheckoutButton({ provider }: { provider: "STRIPE" | "OMISE" }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.nextEndpoint === "/api/billing/omise-charge") {
        // Omise: create charge and show QR
        const chargeRes = await fetch("/api/billing/omise-charge", { method: "POST" });
        const charge = await chargeRes.json();
        if (charge.authorizeUri) {
          window.open(charge.authorizeUri, "_blank");
          toast.success("เปิดหน้าชำระเงินแล้ว กรุณาชำระผ่าน PromptPay");
        } else if (charge.error) {
          toast.error(charge.error);
        }
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onClick} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      ชำระด้วย {provider === "STRIPE" ? "Stripe" : "Omise (พร้อมเพย์)"}
    </Button>
  );
}
