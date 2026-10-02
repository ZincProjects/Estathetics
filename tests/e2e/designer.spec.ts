import { expect, test } from "@playwright/test";
import { autoConfirm, signIn } from "./helpers";
import { TEST_DESIGNER } from "./test-accounts";

test("designer: project → room → photo → scan → redesign", async ({ page }) => {
  autoConfirm(page);
  await signIn(page, TEST_DESIGNER.email);
  await expect(page).toHaveURL(/\/designer/);

  const title = `E2E project ${Date.now()}`;
  await page.getByRole("button", { name: "New project" }).first().click();
  await page.getByLabel("Project name").fill(title);
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "Add room" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Add room" }).click();
  await expect(page.getByRole("heading", { name: "Living room" })).toBeVisible();

  await page.getByTestId("photo-input").setInputFiles("public/mock/room-living.jpg");
  await expect(page.getByAltText("Living room, main photo")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Scan room with AI" }).click();
  await expect(page.getByRole("article", { name: "Scan report" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Estimated, verify on site")).toBeVisible();

  await page.getByRole("button", { name: /Generate \d designs/ }).click();
  await expect(page.getByRole("slider", { name: "Compare original and redesign" }).first()).toBeAttached({ timeout: 60_000 });
  await expect(page.getByAltText("Virtually staged (AI-generated)").first()).toBeVisible();

  // Clean up.
  await page.getByRole("link", { name: title }).click();
  await page.getByRole("button", { name: "Delete project" }).click();
  await expect(page).toHaveURL(/\/designer$/);
});
