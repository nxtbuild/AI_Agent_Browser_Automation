# Website Automation Agent 🤖

This project is a **Playwright + OpenAI Agents** based automation system that can open websites, scroll, fill forms, click, send keys, and take screenshots — all controlled via agent instructions.

## 🚀 Features

- Launches Chromium browser (headless or visible).
- Opens any URL in a new tab.
- Automatically scrolls to specific elements on the page.
- Fills forms (firstName, lastName, email, password) and submits them.
- Takes screenshots of every step for debugging.
- Clicks elements or coordinates on screen.
- Sends keyboard input to active elements.
- Displays filled values using a dialog .
- Closes the browser at the end.

## 🛠️ Tech Stack

- [Playwright](https://playwright.dev/) → browser automation
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/) → agent orchestration
- [Zod](https://zod.dev/) → schema validation
- Node.js (with ES Modules support)

## 📂 Project Structure

```bash
AI_Agent_Browser_Automation/
│── screenshots/ # Screenshots saved here
│── index.js # Entry point for CLI tool
│── package.json # Node.js dependencies & scripts
│── .env # Example env file (API keys, configs)
│── README.md # Documentation


```

## 📦 Installation:

```bash
git clone https://github.com/nxtbuild/AI_Agent_Browser_Automation

cd AI_Agent_Browser_Automation


npm install -g .

**Define OPENAI_API_KEY in .env file and paste your OpenAI KEY**

node index.js


```

🧩 Tools Implemented

open_browser → Opens a new browser tab and navigates to URL.

open_url → Clicks a link by text.

fill_form → Scrolls to contact form, fills values, and submits.

take_screenshot → Saves a screenshot in /screenshots.

show_form_values → Displays entered values.

click_screen → Clicks by coordinates.

send_keys → Types into focused element.

close_browser → Closes the browser.

### 🖥️ Demo Video Link: https://www.youtube.com/watch?v=Qid74LR7fgA
