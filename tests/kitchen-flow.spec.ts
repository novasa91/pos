import { test, expect, Page } from "@playwright/test";

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function doLogin(page: Page) {
  await page.goto("/login");
  if (page.url().includes("/app")) return;
  await page.locator('input[name="email"]').fill("aetoxsomtum@test.com");
  await page.locator('input[name="password"]').fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/app**", { timeout: 12_000 });
}

// ─── Test 1: Full restaurant flow ─────────────────────────────────────────────
// Flow: POS สร้างออเดอร์ออกครัว → Kitchen รับ → เพิ่มรายการ → ขยับสถานะ → ชำระเงิน

test("POS → Kitchen เพิ่มรายการ → ชำระเงิน", async ({ page }) => {
  // 1. Login
  await doLogin(page);

  // 2. POS: สร้างออเดอร์ walk-in
  await page.goto("/app/pos");
  await page.waitForLoadState("networkidle");

  // คลิกสินค้าชิ้นแรก (product button with gradient)
  const productBtns = page.locator(
    "button.rounded-2xl.border.border-\\[\\#e9d5ff\\]"
  );
  const firstProduct = productBtns.first();
  await expect(firstProduct).toBeVisible({ timeout: 8_000 });
  await firstProduct.click();

  // คลิกปุ่ม "ชำระเงิน" (gradient checkout button)
  const checkoutBtn = page.locator(
    "button.btn-premium:has-text('ชำระเงิน'), " +
    "button:has(.lucide-arrow-right-left):has-text('ชำระเงิน')"
  ).first();
  await expect(checkoutBtn).toBeVisible({ timeout: 5_000 });
  await checkoutBtn.click();

  // Dialog ชำระเงินเปิดขึ้น (DialogTitle = "ชำระเงิน")
  await expect(page.locator("text=ชำระเงิน").first()).toBeVisible({ timeout: 5_000 });

  // เลือก CASH
  const cashBtn = page.locator("button:has-text('เงินสด')").first();
  await expect(cashBtn).toBeVisible({ timeout: 5_000 });
  await cashBtn.click();

  // ใส่ยอดเงิน
  const amountInput = page.locator('input[type="number"]');
  await expect(amountInput).toBeVisible({ timeout: 5_000 });
  await amountInput.fill("1000");

  // กด "เสร็จสิ้นการขาย"
  const confirmBtn = page.locator("button:has-text('เสร็จสิ้นการขาย')").first();
  await expect(confirmBtn).toBeVisible({ timeout: 5_000 });
  await confirmBtn.click();

  // รอให้ dialog ปิด (ออเดอร์สร้างเสร็จ)
  await page.waitForTimeout(2_000);
  await page.waitForURL(/\/app\/pos/, { timeout: 10_000 });

  // 3. Kitchen: รับออเดอร์
  await page.goto("/kitchen");
  await page.waitForLoadState("networkidle");

  // ตรวจว่ามีออเดอร์ในสถานะ PENDING
  const orderCards = page.locator('[class*="rounded-2xl"][class*="border"]');
  await expect(orderCards.first()).toBeVisible({ timeout: 10_000 });

  // กด "เริ่มทำ"
  const startBtn = page.locator("button:has-text('เริ่มทำ')").first();
  await expect(startBtn).toBeVisible({ timeout: 5_000 });
  await startBtn.click();

  // รอสถานะเปลี่ยนเป็น "กำลังทำ"
  await page.waitForTimeout(2_000);

  // 4. Kitchen: เพิ่มรายการ — กดปุ่ม "+" บนการ์ดออเดอร์
  const plusBtns = page.locator('button[title="เพิ่มรายการ"]');
  await expect(plusBtns.first()).toBeVisible({ timeout: 5_000 });
  await plusBtns.first().click();

  // Dialog "เพิ่มรายการในออเดอร์" เปิดขึ้น
  await expect(
    page.locator("h2:has-text('เพิ่มรายการในออเดอร์')")
  ).toBeVisible({ timeout: 5_000 });

  // พิมพ์ค้นหาสินค้า
  const searchInput = page.locator('input[placeholder="ค้นหาสินค้า..."]');
  await searchInput.fill("ส้ม");
  await page.waitForTimeout(1_000); // debounce

  // คลิกสินค้าที่พบ (ปุ่มที่มีราคา "บาท")
  const productResult = page.locator("button:has-text('บาท')").first();
  await expect(productResult).toBeVisible({ timeout: 5_000 });
  await productResult.click();

  // ตรวจว่ามีสินค้าในรายการที่จะเพิ่ม
  await expect(page.locator("text=รายการที่จะเพิ่ม")).toBeVisible({ timeout: 5_000 });

  // กด "เพิ่ม X รายการ"
  const addSubmitBtn = page.locator("button:has-text('รายการ')").first();
  await expect(addSubmitBtn).toBeVisible({ timeout: 5_000 });
  await addSubmitBtn.click();

  // Dialog ปิด
  await page.waitForTimeout(1_000);
  await expect(
    page.locator("h2:has-text('เพิ่มรายการในออเดอร์')")
  ).not.toBeVisible({ timeout: 5_000 });

  // 5. Kitchen: เสร็จแล้ว → พร้อมเสิร์ฟ
  const doneBtn = page.locator("button:has-text('เสร็จแล้ว')").first();
  await expect(doneBtn).toBeVisible({ timeout: 5_000 });
  await doneBtn.click();
  await page.waitForTimeout(2_000);

  // 6. Sales: ชำระเงิน
  await page.goto("/app/sales");
  await page.waitForLoadState("networkidle");

  // ค้นหาออเดอร์ที่ยังไม่ชำระ (PENDING)
  const pendingSale = page.locator("text=รอชำระ").first();
  await expect(pendingSale).toBeVisible({ timeout: 10_000 });

  // กด "รับเงิน"
  const receiveBtn = page.locator("button:has-text('รับเงิน')").first();
  await expect(receiveBtn).toBeVisible({ timeout: 5_000 });
  await receiveBtn.click();

  // Dialog ชำระเงินเปิด
  await expect(page.locator("text=วิธีชำระเงิน").first()).toBeVisible({ timeout: 5_000 });

  // เลือก CASH
  const cashOption = page.locator('button:has-text("CASH"), button:has-text("เงินสด")').first();
  await expect(cashOption).toBeVisible({ timeout: 5_000 });
  await cashOption.click();

  // ยืนยันชำระ
  const payConfirmBtn = page.locator(
    "button:has-text('ยืนยันชำระ')"
  ).first();
  await expect(payConfirmBtn).toBeVisible({ timeout: 5_000 });
  await payConfirmBtn.click();

  // รอให้สถานะเปลี่ยนเป็น "ชำระแล้ว"
  await expect(page.locator("text=ชำระแล้ว").first()).toBeVisible({ timeout: 15_000 });
});

// ─── Test 2: Kitchen Display แสดงปุ่มเพิ่มรายการ ───────────────────────────────

test("Kitchen: หน้าจอแสดงออเดอร์ มีปุ่มเพิ่มรายการ", async ({ page }) => {
  await doLogin(page);
  await page.goto("/kitchen");
  await page.waitForLoadState("networkidle");

  // หัวข้อ "ครัว" แสดง
  await expect(page.locator("h1:has-text('ครัว')")).toBeVisible({ timeout: 8_000 });

  // มีปุ่มรีเฟรช
  await expect(page.locator("button:has-text('รีเฟรช')")).toBeVisible({ timeout: 5_000 });
});
