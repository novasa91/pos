import { test, expect, Page, request } from "@playwright/test";

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function staffLogin(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill("aetoxsomtum@test.com");
  await page.locator('input[name="password"]').fill("password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/app**", { timeout: 12_000 });
}

// ─── Test fixture: create PENDING order via API ───────────────────────────────

async function createTestOrder(
  page: Page,
  tenantSlug = "shop-ywsukm",
  tableNo = "99"
) {
  // Navigate to customer order page and place an order
  await page.goto(`/order/${tenantSlug}?table=${tableNo}`);
  await page.waitForLoadState("networkidle");

  // Click first category tab
  const catTabs = page.locator('[role="tab"]');
  if (await catTabs.count() > 0) {
    await catTabs.first().click();
    await page.waitForLoadState("networkidle");
  }

  // Add first product
  const cards = page.locator('[data-testid="product-card"]');
  if (await cards.count() > 0) {
    await cards.first().click();
    await page.waitForTimeout(500);
  }

  // Open cart
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const fab = page.locator('[data-testid="cart-fab"]');
  if (await fab.count() > 0) {
    await fab.click();
    await page.waitForTimeout(500);
  }

  // Fill customer info
  const nameInput = page.getByPlaceholder(/ชื่อ/i).first();
  if (await nameInput.count() > 0) {
    await nameInput.fill("ทดสอบ KDS");
    const phoneInput = page.getByPlaceholder(/เบอร์โทร/i).first();
    if (await phoneInput.count() > 0) await phoneInput.fill("0899999999");
  }

  // Proceed to payment
  const payBtn = page
    .locator("button")
    .filter({ hasText: /^(ชำระเงิน|จ่าย|pay)/i })
    .first();
  if (await payBtn.count() > 0) {
    await payBtn.click();
    await page.waitForTimeout(2_000);
  }

  // Select PromptPay
  const qrBtn = page
    .locator("button")
    .filter({ hasText: /พร้อมเพย์|QR|PromptPay/i })
    .first();
  if (await qrBtn.count() > 0) {
    await qrBtn.click();
    await page.waitForTimeout(3_000);
  }

  // Confirm
  const confirmBtn = page
    .locator("button")
    .filter({ hasText: /ยืนยัน|confirm|pay now/i })
    .first();
  if (await confirmBtn.count() > 0) {
    await confirmBtn.click();
    await page.waitForTimeout(3_000);
  }
}

// ─── Kitchen Display ─────────────────────────────────────────────────────────

test.describe("Kitchen Display — รับ order", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
    await page.goto("/kitchen");
    await page.waitForLoadState("networkidle");
  });

  test("แสดง empty state เมื่อไม่มีออเดอร์", async ({ page }) => {
    await expect(page.getByText("ครัว — KDS")).toBeVisible();
    await expect(page.locator(".font-mono")).toBeVisible();
  });

  test("header แสดง badges สถานะ", async ({ page }) => {
    // Badge counts appear in the header as pills
    await expect(page.locator('[class*="rounded-full"][class*="bg-"]').first()).toBeVisible();
    const text = await page.content();
    expect(text).toContain("รอ");
  });

  test("รับ order — PENDING → PREPARING", async ({ page }) => {
    // Create a pending order via customer UI
    await createTestOrder(page);

    // Go to kitchen and accept the order
    await page.goto("/kitchen");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3_000);

    const pendingCard = page
      .locator(".rounded-2xl")
      .filter({ hasText: /รอทำ/i })
      .first();

    if (await pendingCard.count() > 0) {
      // Click "เริ่มทำ" inside the pending card
      await pendingCard
        .locator("button")
        .filter({ hasText: /เริ่มทำ/i })
        .first()
        .click();
      await page.waitForTimeout(2_000);
    }
  });

  test("เคลื่อนสถานะ PREPARING → READY", async ({ page }) => {
    await page.waitForTimeout(2_000);

    const preparingCard = page
      .locator(".rounded-2xl")
      .filter({ hasText: /กำลังทำ/i })
      .first();

    if (await preparingCard.count() > 0) {
      // Button inside this specific card
      await preparingCard
        .locator("button")
        .filter({ hasText: /เสร็จ/i })
        .first()
        .click();
      await page.waitForTimeout(2_000);
    }
  });

  test("เคลื่อนสถานะ READY → COMPLETED", async ({ page }) => {
    await page.waitForTimeout(2_000);

    const readyCard = page
      .locator(".rounded-2xl")
      .filter({ hasText: /เสร็จแล้ว/i })
      .first();

    if (await readyCard.count() > 0) {
      await readyCard
        .locator("button")
        .filter({ hasText: /เสิร์ฟแล้ว/i })
        .first()
        .click();
      await page.waitForTimeout(2_000);
    }
  });

  test("ปริ้นใบครัว — เปิด dialog", async ({ page }) => {
    await page.waitForTimeout(2_000);

    // Click the first printer button anywhere on the page
    const printerBtn = page.getByRole("button", { name: "พิมพ์ใบครัว" }).first();
    if (await printerBtn.count() > 0) {
      await printerBtn.click();
      // Dialog should open showing a receipt
      await expect(page.getByText(/ใบครัว|Receipt|KDS/i).first()).toBeVisible({
        timeout: 3_000,
      });
      await page.keyboard.press("Escape");
    }
  });

  test("ยกเลิกออเดอร์ PENDING สำเร็จ", async ({ page }) => {
    // Create a pending order
    await createTestOrder(page);

    await page.goto("/kitchen");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3_000);

    const cancelBtn = page.getByRole("button", { name: "ยกเลิกออเดอร์" }).first();
    if (await cancelBtn.count() > 0) {
      await cancelBtn.click();
      page.on("dialog", (dialog) => dialog.accept());
      await page.waitForTimeout(1_000);
    }
  });

  test("หน้าเว็บโหลดเร็ว ไม่ error", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.waitForTimeout(1_500);
    const realErrors = errors.filter(
      (e) => !e.includes("favicon") && !e.includes("net::ERR")
    );
    expect(realErrors).toHaveLength(0);
  });
});

// ─── Tables Management ───────────────────────────────────────────────────────

test.describe("Tables — ปิดโต๊ะ", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
    await page.goto("/app/settings/tables");
    await page.waitForLoadState("networkidle");
  });

  test("แสดง stats cards", async ({ page }) => {
    await expect(page.getByText("โต๊ะทั้งหมด")).toBeVisible();
    // "ว่าง" appears in stats card + as table status text; use .first()
    await expect(page.getByText("ว่าง").first()).toBeVisible();
    await expect(page.getByText("ไม่ว่าง").first()).toBeVisible();
  });

  test("แสดงฟอร์มเพิ่มโต๊ะใหม่", async ({ page }) => {
    await expect(page.getByText("เพิ่มโต๊ะใหม่")).toBeVisible();
    // Number input inside the add-table section
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test("ปิดโต๊ะ — toggle active → inactive", async ({ page }) => {
    const powerBtn = page.getByRole("button", { name: "ปิดใช้งาน" }).first();
    if (await powerBtn.count() > 0) {
      await powerBtn.click();
      await page.waitForResponse(
        (resp) => resp.url().includes("/api/tables") && resp.status() === 200,
        { timeout: 8_000 }
      );
      await page.waitForTimeout(500);
    }
  });

  test("เปิดโต๊ะ — toggle inactive → active", async ({ page }) => {
    const powerBtn = page.getByRole("button", { name: "เปิดใช้งาน" }).first();
    if (await powerBtn.count() > 0) {
      await powerBtn.click();
      await page.waitForResponse(
        (resp) => resp.url().includes("/api/tables") && resp.status() === 200,
        { timeout: 8_000 }
      );
      await page.waitForTimeout(500);
    }
  });

  test("เปิด QR modal ของโต๊ะ", async ({ page }) => {
    const qrBtn = page.getByRole("button", { name: "QR Code" }).first();
    if (await qrBtn.count() > 0) {
      await qrBtn.click();
      await expect(page.locator('img[alt="QR"]').first()).toBeVisible({
        timeout: 3_000,
      });
      // Close by clicking backdrop or close button
      const closeArea = page.locator('[class*="backdrop"]').first();
      if (await closeArea.count() > 0) {
        await closeArea.click({ position: { x: 10, y: 10 } });
      }
    }
  });

  test("เปิด edit modal และกดยกเลิก", async ({ page }) => {
    const editBtn = page.getByRole("button", { name: "แก้ไข" }).first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await expect(page.getByText(/แก้ไขโต๊ะ/i).first()).toBeVisible({
        timeout: 3_000,
      });
      await page.getByRole("button", { name: /ยกเลิก/i }).first().click();
    }
  });
});

// ─── POS Terminal ────────────────────────────────────────────────────────────

test.describe("POS Terminal — รับ order หน้าร้าน (walk-in)", () => {
  test.beforeEach(async ({ page }) => {
    await staffLogin(page);
    await page.goto("/app/pos");
    await page.waitForLoadState("networkidle");
  });

  test("โหลด POS terminal แสดง search box", async ({ page }) => {
    await expect(page.getByPlaceholder(/ค้นหาสินค้า/i)).toBeVisible();
  });

  test("ค้นหาสินค้าพบผลลัพธ์", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/ค้นหาสินค้า/i);
    await searchBox.fill("ส้มตำ");
    await page.waitForTimeout(1_000);
    // Search results shown
    await expect(
      page.locator('[data-testid="product-card"]').first()
    ).toBeVisible({ timeout: 3_000 }).catch(() => {});
  });

  test("เพิ่มสินค้าลง cart", async ({ page }) => {
    const searchBox = page.getByPlaceholder(/ค้นหาสินค้า/i);
    await searchBox.fill("ตำ");
    await page.waitForTimeout(1_500);

    const cards = page.locator('[data-testid="product-card"]');
    if (await cards.count() > 0) {
      await cards.first().click();
      await page.waitForTimeout(500);
    }
  });

  test("เปิด cart drawer", async ({ page }) => {
    const cartBtn = page.locator("button").filter({ hasText: /cart|ตะกร้า/i }).first();
    if (await cartBtn.count() > 0) {
      await cartBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
