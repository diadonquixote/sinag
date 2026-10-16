import { expect, test, type Page } from "@playwright/test";

/**
 * The whole account life cycle, with real cookies in a real browser. There is no sign-up:
 * the admin creates a Chairperson -> the Chairperson must choose their own password -> the
 * Chairperson adds a kagawad -> the kagawad must choose their own password -> a password change
 * logs out other devices -> the admin turns the account off -> logged out everywhere.
 * Runs once (desktop), since it changes the database.
 */
const PASSWORD = process.env.SEED_PASSWORD ?? "";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  // Wait for the answer: either a desk, or back on /login with a message.
  await page.waitForURL((url) => url.pathname !== "/login" || url.search.includes("err=") || url.search.includes("ok="));
}

async function chooseFirstPassword(page: Page, temporary: string, mine: string) {
  await expect(page.getByRole("heading", { name: "Choose your own password" })).toBeVisible();
  await page.getByLabel("Temporary password", { exact: true }).fill(temporary);
  await page.getByLabel("New password", { exact: true }).fill(mine);
  await page.getByRole("button", { name: "Save my password" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Password changed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose your own password" })).toHaveCount(0);
}

test("there is no public sign-up form", async ({ page }) => {
  await page.goto("/request-access");
  await expect(page.getByRole("heading", { name: "How officials get an account" })).toBeVisible();
  await expect(page.locator("form input[type=password]")).toHaveCount(0);
});

test("the admin adds a Chairperson, who adds their council; both choose their own passwords", async ({ browser }, info) => {
  test.skip(info.project.name !== "desktop", "changes the database; run once");
  test.skip(!PASSWORD, "needs SEED_PASSWORD (the demo data)");

  const stamp = Date.now();
  const chairEmail = `chair.${stamp}@test.ph`;
  const email = `kagawad.${stamp}@test.ph`;
  const name = `Rina Test ${stamp}`;

  // 1. The admin creates the Chairperson's account
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await login(admin, "admin@sinag.demo", PASSWORD);
  await expect(admin).toHaveURL(/\/dashboard\/admin/);
  const create = admin.locator("form").filter({ has: admin.getByRole("button", { name: "Create account" }) });
  await create.getByLabel("Name", { exact: true }).fill(`Chair Test ${stamp}`);
  await create.getByLabel("Email", { exact: true }).fill(chairEmail);
  await create.getByLabel("Position", { exact: true }).selectOption("chairperson");
  await create.getByLabel("Temporary password", { exact: true }).fill("chair-temporary-1");
  await create.getByRole("button", { name: "Create account" }).click();
  await expect(admin.getByRole("status").filter({ hasText: "Account created" })).toBeVisible();

  // 2. The Chairperson logs in and must replace the temporary password first
  const chairCtx = await browser.newContext();
  const chair = await chairCtx.newPage();
  await login(chair, chairEmail, "chair-temporary-1");
  await chooseFirstPassword(chair, "chair-temporary-1", "chair-own-password-1");

  // 3. The Chairperson adds a kagawad from the Team page
  await chair.goto("/dashboard/team");
  const add = chair.locator("form").filter({ has: chair.getByRole("button", { name: "Add official" }) });
  await add.getByLabel("Full name", { exact: true }).fill(name);
  await add.getByLabel("Email", { exact: true }).fill(email);
  await add.getByLabel("Position", { exact: true }).selectOption("kagawad");
  await add.getByLabel("Temporary password", { exact: true }).fill("first-password-123");
  await add.getByRole("button", { name: "Add official" }).click();
  await expect(chair.getByRole("status").filter({ hasText: "can now log in" })).toBeVisible();
  await expect(chair.locator("li", { hasText: name })).toContainText("Has not logged in yet");

  // 4. The kagawad logs in, chooses their own password, and is on the public council page
  const first = await browser.newContext();
  const page = await first.newPage();
  await login(page, email, "first-password-123");
  await expect(page).toHaveURL(/\/dashboard/);
  await chooseFirstPassword(page, "first-password-123", "my-own-password-1");
  await page.goto("/dashboard/kagawad");
  await expect(page).toHaveURL(/\/dashboard\/kagawad/);
  await page.goto("/council");
  await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();

  // 5. A second device logs in; changing the password on it logs the first device out
  const secondCtx = await browser.newContext();
  const second = await secondCtx.newPage();
  await login(second, email, "my-own-password-1");
  await second.goto("/dashboard/profile");
  await second.getByLabel("Current password", { exact: true }).fill("my-own-password-1");
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

  // 7. Turnover: the Chairperson ends a team member's term. They cannot log in any more,
  //    and the seat is free for the next person.
  const leaverName = `Leaver Test ${stamp}`;
  const leaverEmail = `leaver.${stamp}@test.ph`;
  await chair.goto("/dashboard/team");
  const addLeaver = chair.locator("form").filter({ has: chair.getByRole("button", { name: "Add official" }) });
  await addLeaver.getByLabel("Full name", { exact: true }).fill(leaverName);
  await addLeaver.getByLabel("Email", { exact: true }).fill(leaverEmail);
  await addLeaver.getByLabel("Position", { exact: true }).selectOption("kagawad");
  await addLeaver.getByLabel("Temporary password", { exact: true }).fill("leaver-password-1");
  await addLeaver.getByRole("button", { name: "Add official" }).click();
  await expect(chair.getByRole("status").filter({ hasText: "can now log in" })).toBeVisible();

  const card = chair.locator("li", { hasText: leaverName });
  await card.locator("summary", { hasText: "Term ended or left" }).click();
  await card.getByRole("button", { name: "Term ended" }).click();
  await expect(chair.getByRole("status").filter({ hasText: "former official" })).toBeVisible();
  await expect(chair.locator("li", { hasText: leaverName })).toHaveCount(0);

  const leaverCtx = await browser.newContext();
  const leaver = await leaverCtx.newPage();
  await login(leaver, leaverEmail, "leaver-password-1");
  await expect(leaver.getByRole("alert").filter({ hasText: "not active" })).toBeVisible();

  // ...and they are listed as a former official on the public council page
  await leaver.goto("/council");
  await expect(leaver.getByText(leaverName).first()).toBeVisible();

  await Promise.all([first.close(), adminCtx.close(), chairCtx.close(), secondCtx.close(), leaverCtx.close()]);
});

test("the official desks refuse the wrong role", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop" || !PASSWORD);
  await login(page, "kagawad@sinag.demo", PASSWORD);
  await page.goto("/dashboard/admin");
  await expect(page).not.toHaveURL(/\/dashboard\/admin/);
  await page.goto("/dashboard/treasurer");
  await expect(page).not.toHaveURL(/\/dashboard\/treasurer/);
});
