import { expect, test } from "@playwright/test";

test("buyer: public demo listing shows facts, neighbourhood, CEA number and consented enquiry form", async ({ page }) => {
  await page.goto("/l/demo-tampines-4-room");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/CEA Reg\. No\./)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key facts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The neighbourhood" })).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.getByRole("link", { name: "Privacy Policy" }).first()).toBeVisible();
});

test("buyer: unpublished or unknown listings 404", async ({ page }) => {
  const res = await page.goto("/l/this-listing-does-not-exist");
  expect(res?.status()).toBe(404);
});
