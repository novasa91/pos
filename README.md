# POS Cloud — Multi-tenant POS SaaS

POS ออนไลน์แบบ multi-tenant สำหรับร้านค้า พร้อมระบบ subscription รับชำระผ่าน Stripe และ Omise (PromptPay) เริ่มต้น 499 บาท/เดือน ต่อร้าน

**Stack:** Next.js 16 · TypeScript · Tailwind 4 · shadcn/ui · Prisma 6 · Auth.js v5 · Stripe · Omise

---

## ✨ Features

- 🛒 **POS หน้าร้าน** — ค้นหาสินค้า/สแกนบาร์โค้ด, ตะกร้า, ส่วนลด, ภาษี, หลายช่องทางชำระ
- 💳 **ชำระเงิน 4 รูปแบบ** — เงินสด, บัตรเครดิต, โอน, พร้อมเพย์
- 🧾 **ใบเสร็จ** — พิมพ์ผ่าน browser หรือส่ง email (โครงสร้างพร้อม ต้องตั้งค่า Resend)
- 📦 **จัดการสินค้า** — หมวดหมู่, สต็อก, บาร์โค้ด, ราคาทุน/ขาย, แจ้งเตือนสินค้าใกล้หมด
- 👥 **ลูกค้า & พนักงาน** — เก็บประวัติ, แต้มสะสม, role-based access
- 📊 **รายงาน** — ยอดขาย, สินค้าขายดี, ตามหมวดหมู่, ตามช่องทางชำระ, ส่งออก CSV
- 🔐 **Auth & Multi-tenant** — เจ้าของเดียวต่อ 1 ร้าน พร้อม RBAC (OWNER/MANAGER/CASHIER)
- 💼 **Subscription** — Stripe (global) + Omise (พร้อมเพย์) พร้อม webhook
- 🌐 **i18n ไทย/อังกฤษ** — สลับได้ในตั้งค่าร้าน
- 📱 **Responsive** — ใช้ได้ทั้ง mobile, tablet, desktop

---

## 🚀 Quick Start (Local)

```bash
# 1. Install
npm install

# 2. Setup env (already created by default)
cp .env.example .env

# 3. Initialize database
npm run db:migrate

# 4. Seed sample data
npm run db:seed

# 5. Run dev server
npm run dev
```

เปิด http://localhost:3000 แล้ว login ด้วย:

- 📧 **Email:** demo@poscloud.test
- 🔑 **Password:** demo1234

---

## 📁 Project Structure

```
pos/
├── prisma/
│   ├── schema.prisma      # 17 entities, multi-tenant ready
│   ├── seed.ts            # Demo data
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx              # Landing
│   │   │   ├── pricing/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx       # Creates user+tenant+trial
│   │   │   └── onboarding/page.tsx
│   │   ├── app/                      # Protected POS area
│   │   │   ├── pos/                  # POS Terminal
│   │   │   ├── products/             # Products CRUD
│   │   │   ├── categories/
│   │   │   ├── customers/
│   │   │   ├── sales/                # Sales history + detail
│   │   │   ├── reports/              # Dashboard
│   │   │   ├── settings/             # Tenant settings
│   │   │   └── billing/              # Subscription mgmt
│   │   ├── billing/expired/          # Suspended screen
│   │   └── api/
│   │       ├── auth/[...nextauth]/   # Auth.js handler
│   │       ├── billing/              # Checkout, cancel, omise
│   │       ├── webhooks/             # Stripe + Omise webhooks
│   │       └── tenant/switch/
│   ├── lib/
│   │   ├── auth.ts          # Auth.js v5 config
│   │   ├── db.ts            # Prisma singleton
│   │   ├── tenant.ts        # requireTenant / getTenantOptional
│   │   ├── rbac.ts          # 25+ permissions
│   │   ├── stripe.ts        # Stripe SDK
│   │   ├── omise.ts         # Omise SDK + PromptPay
│   │   ├── subscription.ts  # Sub lifecycle helpers
│   │   ├── i18n.ts          # ไทย/อังกฤษ dictionaries
│   │   ├── pricing.ts       # Tax calc
│   │   └── receipt.ts       # Receipt number gen
│   ├── components/
│   │   ├── ui/              # shadcn primitives
│   │   ├── dashboard-shell.tsx
│   │   ├── locale-provider.tsx
│   │   └── stub-page.tsx
│   └── middleware.ts        # (Auth handled via server check)
├── .env.example
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## 🌐 Deploy บน Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create pos-cloud --public --source=. --remote=origin --push
```

### 2. สร้าง Database (Postgres)

แนะนำ **Neon** (free tier):

1. ไปที่ https://neon.tech สมัคร/sign in
2. สร้าง project ใหม่
3. Copy connection string รูปแบบ:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. แก้ Prisma Schema (Production)

ใน `prisma/schema.prisma` เปลี่ยน:

```prisma
datasource db {
  provider = "postgresql"  // เดิม "sqlite"
  url      = env("DATABASE_URL")
}
```

แล้วรัน:

```bash
npx prisma migrate dev --name init
```

### 4. Deploy to Vercel

1. ไปที่ https://vercel.com/new
2. Import GitHub repo
3. ตั้งค่า **Environment Variables**:

| Variable | Value | Required |
|---|---|---|
| `DATABASE_URL` | Neon connection string | ✅ |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | ✅ |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | ✅ |
| `STRIPE_SECRET_KEY` | `sk_test_...` หรือ `sk_live_...` | optional |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` หรือ `pk_live_...` | optional |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (จาก Stripe CLI) | optional |
| `STRIPE_PRICE_ID` | `price_...` (สำหรับแพ็กเกจ 499 THB) | optional |
| `OMISE_PUBLIC_KEY` | `pkey_test_...` หรือ `pkey_live_...` | optional |
| `OMISE_SECRET_KEY` | `skey_test_...` หรือ `skey_live_...` | optional |
| `OMISE_WEBHOOK_SECRET` | ตั้งเอง | optional |
| `RESEND_API_KEY` | `re_...` | optional |
| `EMAIL_FROM` | `POS Cloud <noreply@yourdomain>` | optional |
| `NEXT_PUBLIC_PLAN_PRICE_THB` | `499` | optional |

4. กด **Deploy**

### 5. Setup Webhooks (Production)

**Stripe:**
```bash
stripe listen --forward-to https://your-app.vercel.app/api/webhooks/stripe
```
หรือใน Stripe Dashboard → Webhooks → Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`

**Omise:**
ใน Omise Dashboard → Webhooks → Add endpoint: `https://your-app.vercel.app/api/webhooks/omise`
ตั้ง Secret ให้ตรงกับ `OMISE_WEBHOOK_SECRET`

---

## 🗄️ Database Schema

17 entities, ทุก row มี `tenantId` (multi-tenant shared DB):

- **Auth:** User, Account, Session, VerificationToken
- **Tenant:** Tenant, UserOnTenant, Invitation
- **Subscription:** Subscription, SubscriptionPayment
- **Catalog:** Category, Product
- **CRM:** Customer
- **Shifts:** Shift
- **Sales:** Sale, SaleItem, SalePayment, SaleReturn, ReturnItem
- **Suppliers:** Supplier, Purchase, PurchaseItem
- **Config:** Tax, Discount
- **Audit:** AuditLog

ดูรายละเอียดใน `prisma/schema.prisma`

---

## 💰 Subscription Setup

### Stripe (global)

1. สมัคร https://dashboard.stripe.com
2. สร้าง Product + recurring Price 499 THB/เดือน
3. Copy `Price ID` → `STRIPE_PRICE_ID`
4. ตั้ง webhook ที่ `/api/webhooks/stripe`

### Omise (Thai / PromptPay)

1. สมัคร https://dashboard.omise.co
2. เปิดใช้ PromptPay
3. Copy keys → `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`
4. ตั้ง webhook ที่ `/api/webhooks/omise`

**Demo mode:** ถ้าไม่ตั้งค่า keys ระบบยังรันได้ แต่จะชำระเงินไม่ได้ — จะแสดง error ในหน้า Billing

---

## 🧪 Testing

```bash
# Type check
npx tsc --noEmit

# Build (production)
npm run build

# Lint
npm run lint

# Prisma Studio (GUI for DB)
npm run db:studio
```

---

## 📋 Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run db:migrate` | Run Prisma migration |
| `npm run db:push` | Push schema (no migration) |
| `npm run db:seed` | Insert demo data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | ⚠️ Drop and re-create DB |

---

## 🛣️ Roadmap (ส่วนที่ยังไม่ได้ทำในเวอร์ชันนี้)

ฐานข้อมูลรองรับแล้ว ส่วน UI/UX จะทยอยเพิ่ม:

- ⏳ หน้า **คืนสินค้า** (returns UI) — เลือกบิลเดิม, เลือกสินค้า, คืนเงิน
- ⏳ หน้า **กะทำงาน** (shifts) — เปิด/ปิดกะ, นับเงินสด
- ⏳ หน้า **พนักงาน** (employees CRUD) + PIN login
- ⏳ หน้า **ซัพพลายเออร์** (suppliers CRUD)
- ⏳ หน้า **ใบซื้อเข้า** (purchase orders)
- ⏳ ส่ง **ใบเสร็จทาง email** (ต้องตั้งค่า Resend API key)
- ⏳ **Email receipt template** พร้อม PDF
- ⏳ **Audit log** viewer
- ⏳ **Barcode camera scanner** (mobile)
- ⏳ **Thermal printer** (ESC/POS)

---

## 📜 License

เป็นของคุณเจ้าของโปรเจกต์ — ใช้ ขาย แก้ไข ต่อยอดได้ตามต้องการ
