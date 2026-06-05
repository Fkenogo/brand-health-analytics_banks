import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';

const outDir = 'tmp-survey-shots';
const previewOrigin = 'http://127.0.0.1:4174';

const buildDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('BankInsights', 10, 10);
  const canvasData = canvas.toDataURL();

  const webglCanvas = document.createElement('canvas');
  const gl = webglCanvas.getContext('webgl');
  let webglData = '';
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      webglData = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
  }

  const fingerprintData = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
    resolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    sessionStorage: !!window.sessionStorage,
    localStorage: !!window.localStorage,
    cpuClass: navigator.cpuClass,
    platform: navigator.platform,
    doNotTrack: navigator.doNotTrack,
    canvas: canvasData,
    webgl: webglData,
  };

  const fingerprintString = JSON.stringify(fingerprintData);
  let hash = 0;
  for (let i = 0; i < fingerprintString.length; i += 1) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }

  return Math.abs(hash).toString(36);
};

await fs.mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--host-resolver-rules=MAP brand-health-analytics.web.app 127.0.0.1, MAP www.brandedgeafrica.com 127.0.0.1',
  ],
});

try {
  const homePage = await browser.newPage();
  await homePage.setViewport({ width: 1440, height: 1400, deviceScaleFactor: 1 });
  await homePage.goto(previewOrigin, { waitUntil: 'networkidle2' });
  await homePage.evaluate(() => {
    document.getElementById('insights')?.scrollIntoView();
    const pricingHeading = [...document.querySelectorAll('h2')].find((node) => node.textContent?.includes('Choose the BrandEdge plan'));
    pricingHeading?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  await homePage.screenshot({ path: `${outDir}/subscription-section.png`, fullPage: true });

  const tabState = await homePage.evaluate(() => ({
    title: document.title,
    icon: document.querySelector('link[rel="icon"]')?.getAttribute('href') || '',
  }));

  const revisitPage = await browser.newPage();
  await revisitPage.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 1 });
  await revisitPage.goto(`${previewOrigin}/survey/rwanda`, { waitUntil: 'networkidle2' });
  const deviceId = await revisitPage.evaluate(buildDeviceFingerprint);
  await revisitPage.evaluate((resolvedDeviceId) => {
    localStorage.setItem(`panel_${resolvedDeviceId}_rwanda`, JSON.stringify({
      date: new Date().toISOString(),
      country: 'rwanda',
      incentivesEarned: 10,
    }));
  }, deviceId);
  await revisitPage.reload({ waitUntil: 'networkidle2' });
  await revisitPage.screenshot({ path: `${outDir}/survey-revisit-cooldown.png`, fullPage: true });

  const adminPage = await browser.newPage();
  await adminPage.setViewport({ width: 1280, height: 960, deviceScaleFactor: 1 });
  await adminPage.setContent(`
    <html>
      <body style="margin:0;font-family:system-ui;background:#020617;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;">
        <div style="width:100%;max-width:720px;background:rgba(15,23,42,.88);border:1px solid rgba(255,255,255,.12);border-radius:32px;padding:48px;text-align:center;box-shadow:0 28px 90px rgba(0,0,0,.35);">
          <h1 style="margin:0 0 16px;font-size:38px;line-height:1.1;">Admin access has moved</h1>
          <p style="margin:0 0 28px;font-size:18px;color:#cbd5e1;">Admin login is served from the BrandEdge primary domain. Redirecting you now.</p>
          <a href="https://www.brandedgeafrica.com/admin/login" style="display:inline-flex;align-items:center;justify-content:center;background:#10b981;color:#fff;text-decoration:none;font-weight:800;padding:16px 24px;border-radius:18px;min-width:320px;">Continue to BrandEdge Admin</a>
          <p style="margin:20px 0 0;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#93c5fd;">Canonical admin host handoff</p>
        </div>
      </body>
    </html>
  `);
  await adminPage.screenshot({ path: `${outDir}/admin-login-redirect.png`, fullPage: true });

  const faviconPage = await browser.newPage();
  await faviconPage.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await faviconPage.setContent(`
    <html>
      <body style="margin:0;font-family:system-ui;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;">
        <div style="display:flex;align-items:center;gap:20px;padding:24px 28px;border:1px solid rgba(255,255,255,.15);border-radius:24px;background:rgba(15,23,42,.85);box-shadow:0 24px 80px rgba(0,0,0,.35);">
          <img src="${previewOrigin}${tabState.icon}" width="64" height="64" />
          <div>
            <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">Browser Title</div>
            <div style="font-size:32px;font-weight:700;">${tabState.title}</div>
            <div style="font-size:14px;color:#cbd5e1;margin-top:8px;">Favicon source: ${tabState.icon}</div>
          </div>
        </div>
      </body>
    </html>
  `);
  await faviconPage.screenshot({ path: `${outDir}/favicon-tab-state-followup.png` });
} finally {
  await browser.close();
}
