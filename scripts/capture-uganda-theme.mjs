import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const outDir = 'tmp-survey-shots';
const surveyUrl = 'http://127.0.0.1:4174/survey/uganda';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clickButtonByText = async (page, label) => {
  await page.evaluate((targetLabel) => {
    const buttons = [...document.querySelectorAll('button')];
    const match = buttons.find((button) => button.textContent?.replace(/\s+/g, ' ').trim().includes(targetLabel));
    if (!match) throw new Error(`Button not found: ${targetLabel}`);
    match.click();
  }, label);
};

await fs.mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  timeout: 120000,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
  await page.goto(surveyUrl, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: `${outDir}/uganda-intro-screen.png`, fullPage: true });

  await page.click('input[type="checkbox"]');
  await clickButtonByText(page, 'Begin Questionnaire');
  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('When was the last time you used a commercial bank'));
  await clickButtonByText(page, 'This week');
  await page.screenshot({ path: `${outDir}/uganda-single-select-radio.png`, fullPage: true });
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Which of the following age categories do you fall in'));
  await page.screenshot({ path: `${outDir}/uganda-age-question.png`, fullPage: true });
  await clickButtonByText(page, '25-34');
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Which bank from your country comes to your mind FIRST'));
  await page.type('input[type="text"], textarea', 'KC', { delay: 80 });
  await page.screenshot({ path: `${outDir}/uganda-awareness-top-stable.png`, fullPage: true });
  await page.type('input[type="text"], textarea', 'B', { delay: 80 });
  await delay(400);
  await page.screenshot({ path: `${outDir}/uganda-awareness-recognized.png`, fullPage: true });
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Which other banks from your country come to your mind'));
  await page.type('input[type="text"], textarea', 'DF', { delay: 80 });
  await page.screenshot({ path: `${outDir}/uganda-awareness-spontaneous-stable.png`, fullPage: true });
  await page.type('input[type="text"], textarea', 'CU, Stanbic', { delay: 80 });
  await delay(500);
  await page.screenshot({ path: `${outDir}/uganda-awareness-input.png`, fullPage: true });
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Tick all banks that you are aware of'));
  await page.screenshot({ path: `${outDir}/uganda-multi-select-checkbox.png`, fullPage: true });
  await clickButtonByText(page, 'Absa');
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Brand Usage'));
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Which of these banks you are aware of have you ever banked with or used'));
  await clickButtonByText(page, 'Absa');
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Which banks are you currently using'));
  await clickButtonByText(page, 'Absa');
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('Future Intent'));
  await clickButtonByText(page, 'Continue');

  await page.waitForFunction(() => document.querySelector('main h2')?.textContent?.includes('How likely are you to bank with each of the following banks in the future'));
  await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('button')].filter((button) => button.className.includes('rounded-full'));
    if (!buttons[8]) throw new Error('Matrix rating button not found.');
    buttons[8].click();
  });
  await page.screenshot({ path: `${outDir}/uganda-matrix-rating.png`, fullPage: true });
} finally {
  await browser.close();
}
