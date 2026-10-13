import { expect, test } from "@playwright/test";

/** Every public page, as a visitor with no account sees it. */
const PAGES = ["/", "/feed", "/projects", "/calendar", "/funds", "/council", "/login", "/request-access"];

for (const path of PAGES) {
  test(`${path} loads with no errors`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push(e.message));

    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("header").first()).toBeVisible();
    await page.screenshot({ path: info.outputPath(`${path === "/" ? "home" : path.slice(1).replaceAll("/", "-")}.png`), fullPage: true });
    // Console errors include anything the security policy blocked.
    expect(errors).toEqual([]);
  });
}

test("security headers are sent with every page", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("the official desks need a login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
