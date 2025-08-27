// @ts-check
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
test.only("page_screenshot", async ({ page }) => {
  await page.goto("https://ui.chaicode.com/auth-sada/signup?");
  const filePath = `screenshot-${crypto.randomUUID()}.jpeg`;
  await page.screenshot({ path: filePath, fullPage: true });
  const imgBuffer = fs.readFileSync(filePath);
  const base64Img = imgBuffer.toString("base64");
});
