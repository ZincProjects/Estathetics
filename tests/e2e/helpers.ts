import { expect, type Page } from "@playwright/test";
import { TEST_PASSWORD } from "./test-accounts";

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Accept the native confirm() dialogs used by destructive buttons. */
export function autoConfirm(page: Page) {
  page.on("dialog", (d) => d.accept());
}
