// Omise client and helpers
// All methods are no-ops if OMISE keys are missing (demo mode)
import { createHmac } from "crypto";

const publicKey = process.env.OMISE_PUBLIC_KEY;
const secretKey = process.env.OMISE_SECRET_KEY;

type OmiseFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
};

async function omiseFetch(path: string, opts: OmiseFetchOptions = {}): Promise<any> {
  if (!secretKey) throw new Error("OMISE_SECRET_KEY is not set");
  const url = `https://api.omise.co${path}`;
  const headers: Record<string, string> = {
    Authorization: "Basic " + Buffer.from(`${secretKey}:`).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const init: RequestInit = {
    method: opts.method ?? "GET",
    headers,
  };
  if (opts.body) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.body)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "object") {
        for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
          params.append(`${k}[${k2}]`, String(v2));
        }
      } else {
        params.append(k, String(v));
      }
    }
    init.body = params.toString();
  }
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Omise ${res.status}: ${err}`);
  }
  return res.json();
}

export function isOmiseEnabled(): boolean {
  return !!publicKey && !!secretKey;
}

export async function createOmisePromptPayCharge(params: {
  amount: number; // satang (499 THB = 49900)
  email: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ id: string; authorizeUri?: string }> {
  const charge = await omiseFetch("/charges", {
    method: "POST",
    body: {
      amount: params.amount,
      currency: "THB",
      source: { type: "promptpay" },
      return_uri: process.env.NEXT_PUBLIC_APP_URL + "/billing/return",
      description: params.description,
      metadata: { email: params.email, ...(params.metadata ?? {}) },
    },
  });
  return { id: charge.id, authorizeUri: charge.authorize_uri };
}

export function verifyOmiseWebhook(payload: string, signature: string | null): boolean {
  const secret = process.env.OMISE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}

export async function getOmiseCharge(chargeId: string): Promise<any> {
  return omiseFetch(`/charges/${chargeId}`);
}
