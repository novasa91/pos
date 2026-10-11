"use client";

import { useState } from "react";

type Step = "idle" | "resetting" | "seeding" | "done" | "error";

export default function AdminResetPage() {
  const [step, setStep] = useState<Step>("idle");
  const [message, setMessage] = useState<string>("");

  async function callApi(path: string) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText} — ${text}`);
    }
    return text;
  }

  async function runReset() {
    if (
      !confirm(
        "ลบข้อมูลทั้งหมด (สินค้า/ลูกค้า/พนักงาน/ออเดอร์/โต๊ะ/หมวดหมู่) แล้วเติม demo data ใหม่?\n\nการกระทำนี้ไม่สามารถ undo ได้",
      )
    ) {
      return;
    }
    setMessage("");
    try {
      setStep("resetting");
      const reset = await callApi("/api/admin/reset-tenant");
      setMessage(`Reset: ${reset}`);

      setStep("seeding");
      const seed = await callApi("/api/admin/seed-demo");
      setMessage(`Seed: ${seed}`);
      setStep("done");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
      setStep("error");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold">Reset &amp; Reseed Demo Data</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wipes products, customers, employees, orders, tables, categories for
        the current tenant, then re-creates the standard demo catalogue.
        Use only on the demo tenant.
      </p>

      <div className="mt-6 rounded-lg border bg-card p-4">
        <button
          onClick={runReset}
          disabled={step === "resetting" || step === "seeding"}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {step === "idle" || step === "done" || step === "error"
            ? "Reset & Reseed"
            : step === "resetting"
              ? "กำลังลบข้อมูล..."
              : "กำลังเติมข้อมูล..."}
        </button>
        {message && (
          <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs">
            {message}
          </pre>
        )}
        {step === "done" && (
          <p className="mt-3 text-sm text-green-600">
            เสร็จเรียบร้อย — ระบบพร้อมสำหรับผู้ใช้ใหม่แล้ว
          </p>
        )}
        {step === "error" && (
          <p className="mt-3 text-sm text-red-600">เกิดข้อผิดพลาด ดู log ด้านบน</p>
        )}
      </div>
    </div>
  );
}
