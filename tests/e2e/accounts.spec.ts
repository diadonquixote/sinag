import { expect, test, type Page } from "@playwright/test";

/**
 * The whole account life cycle, with real cookies in a real browser:
 * request -> pending -> admin approves -> log in -> password change logs out other devices
 * -> admin turns the account off -> logged out everywhere.
 * Runs once (desktop), since it changes the database.
 */
const PASSWORD = process.env.SEED_PASSWORD ?? "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test("an official asks for an account, is approved, and can be logged out everywhere", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "changes the database; run once");
  test.skip(!PASSWORD, "needs SEED_PASSWORD (the demo data)");

  const email = `kagawad.${Date.now()}@test.ph`;
  const name = "Rina Test Kagawad";
  const first = await browser.newContext();
  const page = await first.newPage();

  // 1. Request
  await page.goto("/request-access");
  await page.getByLabel("Full name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Position", { exact: true }).selectOption("kagawad");
  await page.getByLabel("How can the admin confirm it is you?", { exact: true }).fill("Elected SK Kagawad, 2023. Ask the Chairperson.");
  await page.getByLabel("Password", { exact: true }).fill("first-password-123");
  await page.locator('input[name="confirm"]').check();
  await page.locator('input[name="privacy"]').check();
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Request sent" })).toBeVisible();

  // 2. Not yet
  await login(page, email, "first-password-123");
  await expect(page.getByRole("alert").filter({ hasText: "waiting for the site admin" })).toBeVisible();

  // 3. The admin approves
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@sinag.demo", PASSWORD);
  await expect(admin).toHaveURL(/\/dashboard\/admin/);
  const card = admin.locator("li", { hasText: name });
  await expect(card).toContainText(email);
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "can now log in" })).toBeVisible();

  // 4. Now they can log in, and they are on the public council page
  await login(page, email, "first-password-123");
  await expect(page).toHaveURL(/\/dashboard\/kagawad/);
  await page.goto("/council");
  await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();

  // 5. A second device logs in; changing the password on it logs the first device out
  const secondCtx = await browser.newContext();
  const second = await secondCtx.newPage();
  await login(second, email, "first-password-123");
  await second.goto("/dashboard/profile");
  await second.getByLabel("Current password", { exact: true }).fill("first-password-123");
  await second.getByLabel("New password", { exact: true }).fill("second-password-456");
  await second.getByRole("button", { name: "Change password" }).click();
  await expect(second.getByRole("status").filter({ hasText: "logged out" })).toBeVisible();
  await page.goto("/dashboard/kagawad");
  await expect(page).toHaveURL(/\/login/);
  await second.goto("/dashboard/kagawad");
  await expect(second).toHaveURL(/\/dashboard\/kagawad/);

  // 6. The admin turns the account off; the second device is logged out too
  await admin.goto("/dashboard/admin");
  const row = admin.locator("li", { hasText: email });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Turn off account" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "can no longer log in" })).toBeVisible();
  await second.goto("/dashboard/kagawad");
  await expect(second).toHaveURL(/\/login/);
  await login(second, email, "second-password-456");
  await expect(second.getByRole("alert").filter({ hasText: "not active" })).toBeVisible();

  await Promise.all([first.close(), adminCtx.close(), secondCtx.close()]);
});

test("the official desks refuse the wrong role", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop" || !PASSWORD);
  await login(page, "kagawad@sinag.demo", PASSWORD);
  await page.goto("/dashboard/admin");
  await expect(page).not.toHaveURL(/\/dashboard\/admin/);
  await page.goto("/dashboard/treasurer");
  await expect(page).not.toHaveURL(/\/dashboard\/treasurer/);
});
