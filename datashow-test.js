import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });
  const context = await browser.newContext({ viewport: null });

  await context.addInitScript(() => {
    window.__nativeAlert = window.alert.bind(window);
  });

  const page = await context.newPage();

  page.on("dialog", async (dialog) => {
    console.log("Dialog message:", dialog.message());
    await new Promise((r) => setTimeout(r, 3000));
    await dialog.accept();
  });

  // Navigate directly to the signup page
  await page.goto("https://nextbuild.in/contact");

  await page.waitForSelector("div.mil-section-title");

  // Scroll to it
  await page.locator("div.mil-section-title").last().scrollIntoViewIfNeeded();

  // Fill out the form
  const userData = {
    name: "Santosh",
    mobileNo: "9988776655",
    email: "santosh@gmail.com",
    description: "I need a custom software. can you schedule meeting with me.",
  };
  await page.fill('[name="name"]', userData.name);
  await page.fill('[name="mobileNo"]', userData.mobileNo);
  await page.fill('[name="email"]', userData.email);
  await page.fill('textarea[name="description"]', userData.description);

  // Submit the form
  await page.click('button[type="submit"]');

  // Use the preserved native alert to show the values
  await page.evaluate(({ name, mobileNo, email, description }) => {
    const msg =
      `Name: ${name}\n` +
      `MobileNo: ${mobileNo}\n` +
      `Email: ${email}\n` +
      `Message: ${description}`;

    if (typeof window.__nativeAlert === "function") {
      window.__nativeAlert(msg);
    } else if (typeof window.alert === "function") {
      window.alert(msg);
    } else {
      // Fallback: render visible message on the page
      const toast = document.createElement("div");
      toast.innerText = msg;
      Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        padding: "12px",
        fontFamily: "monospace",
        whiteSpace: "pre-line",
        zIndex: 9999,
      });
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 4000);
    }
  }, userData);

  await page.waitForTimeout(3000);
  await browser.close();
})();
