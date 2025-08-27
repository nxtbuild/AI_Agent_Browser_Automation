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
    await new Promise((r) => setTimeout(r, 5000));
    await dialog.accept();
  });

  // Navigate directly to the signup page
  await page.goto("https://ui.chaicode.com/auth/signup");
  await page.waitForSelector("#firstName", { timeout: 10000 });

  // Fill out the form
  const userData = {
    firstName: "Santosh",
    lastName: "Vishwakarma",
    email: "santosh@gmail.com",
    password: "sde00918#$",
  };
  await page.fill("#firstName", userData.firstName);
  await page.fill("#lastName", userData.lastName);
  await page.fill("#email", userData.email);
  await page.fill("#password", userData.password);
  await page.fill("#confirmPassword", userData.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Use the preserved native alert to show the values
  await page.evaluate(({ firstName, lastName, email, password }) => {
    const msg =
      `FirstName: ${firstName}\n` +
      `LastName: ${lastName}\n` +
      `Email: ${email}\n` +
      `Password: ${password}`;

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
