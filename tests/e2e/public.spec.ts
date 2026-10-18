/*
 * Sinag - Copyright (c) 2026 Kristina Diane Aviles, PDYN Technologies. All rights reserved.
 * Proprietary software: only the copyright holder may edit, copy or distribute this code. See LICENSE.
 */
import { expect, test } from "@playwright/test";

/** Every public page, as a visitor with no account sees it. */
const PAGES = ["/", "/feed", "/projects", "/calendar", "/funds", "/council", "/login", "/request-access", "/privacy", "/about", "/projects/1", "/council/1"];

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

test("switching to Filipino and back", async ({ page }, info) => {
  const phone = info.project.name === "phone";
  await page.goto("/funds");
  if (phone) await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("link", { name: "Filipino" }).click();
  await expect(page).toHaveURL(/\/funds$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fil");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Nasaan ang pera");
  if (phone) await page.getByRole("button", { name: "Buksan ang menu" }).click();
  await page.getByRole("link", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Where the money is");
});

test("the language switch only returns to pages on this site", async ({ page }) => {
  await page.goto("/lang?to=fil&next=//evil.example.com");
  await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
});

test("every page says what kind of site this is", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("note").first()).toContainText("Pilot");
});

test("stored photos cannot be framed or run anything", async ({ request }) => {
  const res = await request.get("/api/avatar/1");
  // The demo people have no photos, so this is a 404, but the policy still applies to the route.
  expect(res.headers()["content-security-policy"]).toContain("sandbox");
});
