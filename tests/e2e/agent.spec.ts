import { expect, test } from "@playwright/test";
import { autoConfirm, signIn } from "./helpers";
import { TEST_AGENT } from "./test-accounts";

test("agent: listing → photo → neighbourhood → copy → publish → enquiry", async ({ page, context }) => {
  autoConfirm(page);
  await signIn(page, TEST_AGENT.email);
  await expect(page).toHaveURL(/\/agent/);

  const title = `E2E 4-room ${Date.now()}`;
  await page.getByRole("link", { name: "New listing" }).first().click();
  await page.getByLabel("Listing title").fill(title);
  await page.getByRole("combobox").fill("520475");
  await page.getByRole("option").first().click();
  await expect(page.getByText("Location pinned")).toBeVisible();
  await page.getByLabel("Floor area").fill("1001");
  await page.getByLabel("Bedrooms").fill("3");
  await page.getByLabel("Lease start year").fill("1990");
  await page.getByLabel("Asking price (SGD)").fill("620000");
  await page.getByRole("button", { name: "Create listing" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByTestId("photo-input").setInputFiles("public/mock/room-living.jpg");
  await expect(page.getByLabel("Photo label")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Build neighbourhood report" }).click();
  await expect(page.getByRole("heading", { name: "MRT / LRT stations" })).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Write listing copy" }).click();
  await expect(page.getByText(/written by AI from your facts only|demo template/)).toBeVisible({ timeout: 60_000 });

  await page.getByRole("button", { name: "Publish listing" }).click();
  const publicLink = page.getByRole("link", { name: "View public page" });
  await expect(publicLink).toBeVisible();
  const href = await publicLink.getAttribute("href");

  // Buyer view (signed out) of the freshly published listing.
  const buyer = await context.browser()!.newPage();
  await buyer.goto(href!);
  await expect(buyer.getByText(/CEA Reg\. No\./)).toBeVisible();
  await buyer.getByLabel("Name").fill("E2E Buyer");
  await buyer.getByLabel("Email").fill("buyer.e2e@example.com");
  await buyer.getByRole("button", { name: "Send enquiry" }).click();
  await expect(buyer.getByText("Please tick the consent box")).toBeVisible();
  await buyer.getByRole("checkbox").check();
  await buyer.getByRole("button", { name: "Send enquiry" }).click();
  await expect(buyer.getByText(/enquiry has been sent/)).toBeVisible();
  await buyer.close();

  await page.goto("/leads");
  await expect(page.getByText("E2E Buyer").first()).toBeVisible();

  // Clean up.
  await page.goto("/agent");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Delete listing" }).click();
  await expect(page).toHaveURL(/\/agent$/);
});
