import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import fs from "fs";
import { chromium } from "playwright";

// --- Launch the browser ---
const browser = await chromium.launch({
  headless: false,
  chromiumSandbox: true,
  slowMo: 500,
  env: {},
  args: ["--start-maximized"],
});

const context = await browser.newContext({
  viewport: null, // disable fixed viewport, allow full window size
});

const page = await context.newPage();

// --- Take screenshot on every step ---
const takeScreenShot = tool({
  name: "take_screenshot",

  description: `Takes a screenshot of the current page add saved it to a file named like step_1_${crypto.randomUUID()}.png, step_2_${crypto.randomUUID()}.png etc`,
  parameters: z.object({ filename: z.string() }),
  async execute({ filename }) {
    try {
      await page.screenshot({ path: "screenshots/" + filename });
      return `Screenshot saved as ${filename}`;
    } catch (err) {
      console.error("Screenshot error:", err);
      throw new Error(
        `Screenshot failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  },
});

// --- Open new tab page ---
const openBrowser = tool({
  name: "open_browser",
  description: "Open a new browser tab page",
  parameters: z.object({
    url: z.string(),
  }),
  async execute({ url }) {
    await page.goto(url);
    await page.waitForSelector("div.mil-section-title");
    // Scroll to it
    await page.locator("div.mil-section-title").last().scrollIntoViewIfNeeded();
  },
});

// --- Open the url into page ---
const openURL = tool({
  name: "open_url",
  description: "Navigates the browser to a specific link by visible text",
  parameters: z.object({
    linkText: z.string(),
  }),
  async execute({ linkText }) {
    try {
      // wait until at least one link is visible
      await page.waitForSelector("a", { timeout: 3000 });

      const links = await page.$$("a");

      for (const link of links) {
        const text = await link.innerText();
        if (text.trim().toLowerCase() === linkText.toLowerCase()) {
          await link.click();
          await page.waitForLoadState("domcontentloaded"); // wait for navigation
          return `Clicked link with text: ${linkText}`;
        }
      }
      return `Could not find link with text: ${linkText}`;
    } catch (err) {
      console.error("openURL error:", err);
      throw new Error("Failed to open URL: " + err);
    }
  },
});

// --- Field the form ---
const fillForm = tool({
  name: "fill_form",
  description:
    "Scroll to the contact section and fill Name, Mobile, Email, and Description fields. Then submit.",
  parameters: z.object({
    name: z.string(),
    mobileNo: z.string(),
    email: z.string(),
    description: z.string(),
  }),
  async execute({ name, mobileNo, email, description }) {
    try {
      // Click Contact link
      await page.click("a:has-text('Contact')");

      // Fill inputs
      await page.fill('[name="name"]', name);
      await page.fill('[name="mobileNo"]', mobileNo);
      await page.fill('[name="email"]', email);
      await page.fill('textarea[name="description"]', description);

      // Submit
      await page.click('button[type="submit"]');

      return "Contact form filled and submitted.";
    } catch (err) {
      console.error("fillContactForm error:", err);
      throw new Error("Failed to fill contact form: " + err);
    }
  },
});

// --- Display the value which are field ---
const showFormValues = tool({
  name: "show_form_values",
  description:
    "Show an alert with Name,MobileNo, email, and description values",
  parameters: z.object({
    name: z.string(),
    mobileNo: z.string(),
    email: z.string(),
    description: z.string(),
  }),
  async execute({ name, mobileNo, email, description }) {
    // Handler for alert
    page.on("dialog", async (dialog) => {
      console.log("Dialog message:", dialog.message());

      await new Promise((r) => setTimeout(r, 5000));
      await dialog.accept();
    });

    await page.evaluate(
      ({ name, mobileNo, email, description }) => {
        const msg =
          `Name: ${name}\n` +
          `MobileNo: ${mobileNo}\n` +
          `Email: ${email}\n` +
          `Message: ${description}`;

        // use native alert if available
        if (typeof window.__nativeAlert === "function") {
          window.__nativeAlert(msg);
        } else if (typeof window.alert === "function") {
          window.alert(msg);
        } else {
          // add a div to the page
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
      },
      { firstName, lastName, email, password }
    );
    return `Form Values → Name: ${name}, Mobile: ${mobileNo}, Email: ${email}, Description: ${description}`;
  },
});

// --- click on the screen ---
const clickOnScreen = tool({
  name: "click_screen",
  description: "Clicks on the screen with specified co-ordinates",
  parameters: z.object({
    x: z.number().describe("x axis on the screen where we need to click"),
    y: z.number().describe("Y axis on the screen where we need to click"),
  }),
  async execute(input) {
    input.x;
    input.y;
    await page.mouse.click(input.x, input.y);
  },
});

// --- Keyborad keypress ---
const sendKeys = tool({
  name: "send_keys",
  description: "Send the keystroks to the current fucsed element.",
  parameters: z.object({
    text: z.string().describe("Text send as keystroks"),
  }),
  async execute({ text }) {
    page.keyboard.type(text);
    return `Typed text is ${text}`;
  },
});

const closeBrowser = tool({
  name: "close_browser",
  parameters: z.object({}),
  async execute() {
    await browser.close();
    return "Browser closed";
  },
});

// Double Click, Scroll

const websiteAutomationAgent = new Agent({
  name: "WebSite Automation Agent",
  instructions: `
  You are a web automation agent. Use tools to open pages, scroll and fill forms.

  Rules:
   - After every tool calling take a screenshot.
   - Go to the website, click "Contact" and also scroll to the contact form.
   - Fill it with the following data:
     - Name: Santosh Vishwakarma
     - Mobile No: 9876543210
     - Email: santosh@gmail.com
     - Description: Hello, this is a test automation message.
   - After filling the form, click the submit button, display the filled values, and then close the browser.
  `,
  tools: [
    takeScreenShot,
    openBrowser,
    openURL,
    fillForm,
    showFormValues,
    clickOnScreen,
    sendKeys,
    closeBrowser,
  ],
});

// --- Run ---
const result = await run(
  websiteAutomationAgent,
  ` Go to https://nextbuild.in/, then click the "Contact" link and fill the contact form.
  `
);
console.log(result.finalOutput);
