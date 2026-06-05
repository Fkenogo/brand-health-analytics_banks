import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const outDir = 'tmp-survey-shots';
const surveyUrl = 'http://127.0.0.1:4173/survey/rwanda';

const clickButtonByText = async (page, label) => {
  await page.evaluate((targetLabel) => {
    const buttons = [...document.querySelectorAll('button')];
    const match = buttons.find((button) => button.textContent?.trim() === targetLabel);
    if (!match) {
      throw new Error(`Button not found: ${targetLabel}`);
    }
    match.click();
  }, label);
};

await fs.mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
await page.goto(surveyUrl, { waitUntil: 'networkidle2' });
await page.screenshot({ path: `${outDir}/consent-screen.png`, fullPage: true });

await page.click('input[type="checkbox"]');
await clickButtonByText(page, 'Begin Questionnaire');
await page.waitForFunction(() =>
  document.querySelector('main h2')?.textContent?.includes('When was the last time you used a commercial bank'),
);
await page.screenshot({ path: `${outDir}/question-screen.png`, fullPage: true });
await clickButtonByText(page, 'This week');
await clickButtonByText(page, 'Continue');
await page.waitForFunction(() =>
  document.querySelector('main h2')?.textContent?.includes('Which of the following age categories do you fall in'),
);
await page.screenshot({ path: `${outDir}/age-question-screen.png`, fullPage: true });

await clickButtonByText(page, 'Below 18');
await clickButtonByText(page, 'Continue');
await page.waitForFunction(() => document.body.textContent?.includes('This survey is for respondents 18 years and older'));
await page.screenshot({ path: `${outDir}/under-18-termination-screen.png`, fullPage: true });

const eligiblePage = await browser.newPage();
await eligiblePage.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
await eligiblePage.goto(surveyUrl, { waitUntil: 'networkidle2' });
await eligiblePage.click('input[type="checkbox"]');
await clickButtonByText(eligiblePage, 'Begin Questionnaire');
await eligiblePage.waitForFunction(() =>
  document.querySelector('main h2')?.textContent?.includes('When was the last time you used a commercial bank'),
);
await clickButtonByText(eligiblePage, 'This week');
await clickButtonByText(eligiblePage, 'Continue');
await eligiblePage.waitForFunction(() =>
  document.querySelector('main h2')?.textContent?.includes('Which of the following age categories do you fall in'),
);
await clickButtonByText(eligiblePage, '25-34');
await clickButtonByText(eligiblePage, 'Continue');
await eligiblePage.waitForFunction(() =>
  document.querySelector('main h2')?.textContent?.includes('Which bank from your country comes to your mind FIRST'),
);
await eligiblePage.screenshot({ path: `${outDir}/post-age-continuation-screen.png`, fullPage: true });

const tabState = await page.evaluate(() => ({
  title: document.title,
  icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || '',
}));

const thankYouPage = await browser.newPage();
await thankYouPage.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1 });
await thankYouPage.setContent(`
  <html>
    <body style="margin:0;font-family:system-ui;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
      <div style="width:100%;max-width:640px;background:rgba(15,23,42,.86);border:1px solid rgba(255,255,255,.12);border-radius:40px;padding:56px 40px;text-align:center;box-shadow:0 28px 90px rgba(0,0,0,.35);">
        <div style="font-size:64px;line-height:1;color:#10b981;margin-bottom:24px;">✓</div>
        <h1 style="margin:0 0 16px;font-size:40px;line-height:1.1;">Thank you for your feedback</h1>
        <p style="margin:0 0 12px;font-size:20px;color:#e2e8f0;">Your response has been recorded anonymously and will help improve banking services.</p>
        <p style="margin:0 0 32px;font-size:16px;color:#94a3b8;">BrandEdge uses survey responses only in aggregated reporting and service improvement analysis.</p>
        <a href="https://www.brandedgeafrica.com" style="display:inline-flex;align-items:center;justify-content:center;gap:12px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;padding:16px 24px;border-radius:20px;min-width:280px;">Visit BrandEdge ↗</a>
      </div>
    </body>
  </html>
`);
await thankYouPage.screenshot({ path: `${outDir}/thank-you-screen.png` });

const tabPage = await browser.newPage();
await tabPage.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
await tabPage.setContent(`
  <html>
    <body style="margin:0;font-family:system-ui;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div style="display:flex;align-items:center;gap:20px;padding:24px 28px;border:1px solid rgba(255,255,255,.15);border-radius:24px;background:rgba(15,23,42,.85);box-shadow:0 24px 80px rgba(0,0,0,.35);">
        <img src="http://127.0.0.1:4173${tabState.icon}" width="64" height="64" />
        <div>
          <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">Browser Title</div>
          <div style="font-size:32px;font-weight:700;">${tabState.title}</div>
          <div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Favicon source: ${tabState.icon}</div>
        </div>
      </div>
    </body>
  </html>
`);
await tabPage.screenshot({ path: `${outDir}/browser-tab-state.png` });

await browser.close();
console.log(JSON.stringify(tabState));
