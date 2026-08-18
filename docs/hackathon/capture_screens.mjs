import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, "screenshots");
mkdirSync(outDir, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  "C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe";
const base = "http://localhost:3000";
const email = `pitch.demo.${Date.now()}@smartprofits.dev`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  defaultViewport: { width: 1440, height: 900 },
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();

await page.goto(`${base}/register`, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(() => {
  localStorage.setItem("smartprofit-locale", "en");
  localStorage.setItem("smartprofit-theme", "dark");
});
await page.reload({ waitUntil: "networkidle0" });
await page.waitForSelector("#email", { timeout: 15000 });
await page.screenshot({ path: join(outDir, "01-register.png") });

await page.type("#fullName", "Israa Hamad");
await page.type("#storeName", "Gaza Home Store");
await page.type("#email", email);
await page.type("#password", "hackathon2026");
await page.click('input[type="checkbox"]');
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }),
  page.click("button[type='submit']"),
]);
await new Promise((r) => setTimeout(r, 1800));
await page.screenshot({ path: join(outDir, "02-dashboard.png") });

for (const [path, name] of [
  ["/advisor", "03-advisor.png"],
  ["/data", "04-data.png"],
  ["/simulator", "05-simulator.png"],
  ["/ask", "06-ask.png"],
]) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle0", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(outDir, name) });
}

await browser.close();
console.log("screenshots saved to", outDir);
