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
      await page.waitForSelector("a", { timeout: 5000 });

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
    "Find First Name, Last Name, Email, Password and Confirm Password and fill them.",
  parameters: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  }),
  async execute({ firstName, lastName, email, password, confirmPassword }) {
    // Fill an input.

    const fields = [
      { id: "firstName", value: firstName },
      { id: "lastName", value: lastName },
      { id: "email", value: email },
      { id: "password", value: password },
      { id: "confirmPassword", value: confirmPassword },
    ];

    for (const field of fields) {
      const fieldLocate = page.locator(`#${field.id}`);

      if ((await fieldLocate.count()) > 0) {
        console.log(`Found field with id ${field.id}`);
        await fieldLocate.fill(field.value);
      } else {
        console.log(`Field not found with id ${field.id}`);
      }
    }
    // clicking submit button.
    await page.locator('button[type="submit"]').click();

    return "Submitted";
  },
});

// --- Display the value which are field ---
const showFormValues = tool({
  name: "show_form_values",
  description:
    "Show an alert with firstName,lasteName, email, and password values",
  parameters: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    password: z.string(),
  }),
  async execute({ firstName, lastName, email, password }) {
    // Handler for alert
    page.on("dialog", async (dialog) => {
      console.log("Dialog message:", dialog.message());

      await new Promise((r) => setTimeout(r, 5000));
      await dialog.accept();
    });

    await page.evaluate(
      ({ firstName, lastName, email, password }) => {
        const msg =
          `FirstName: ${firstName}\n` +
          `LastName: ${lastName}\n` +
          `Email: ${email}\n` +
          `Password: ${password}`;

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
    return `FirstName: ${firstName}, LastName: ${lastName}, Email: ${email},  and Password: ${password}`;
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
  You are a web automation agent. Use tools to open pages and click links.

  Rules:
   - After every tool calling take a screenshot.
   - Find the Auth Sign Up form and fill it with the given data.
   - First Name: Santosh
   - Last Name: Vishwakarma
   - Email: santosh@gmail.com 
   - Password: sde00918#$
   - Confirm Password: sde00918#$

    After filling the form, click the submit button, display the value which are field and then close the browser.
  `,
  //  model: "gpt-4o-mini",
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
  ` Go to https://ui.chaicode.com/, then click the "Sign Up" link..
  `
);
console.log(result.finalOutput);
