import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4174/';
const now = '2026-10-20T18:00:00.000Z';
const seed = {
  version: 1,
  tournaments: [
    {
      id: 't1',
      name: 'Offline Test',
      date: '2026-10-20',
      leaderId: 'OP01-001',
      createdAt: now,
      updatedAt: now,
    },
  ],
  matches: [],
  customLeaders: [],
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const errors: string[] = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.addInitScript((data) => {
  localStorage.setItem('grand-line-ledger:data:v1', JSON.stringify(data));
}, seed);

await page.goto(BASE, { waitUntil: 'networkidle' });
console.log('title:', await page.title());
console.log(
  'manifest:',
  await page.locator('link[rel="manifest"]').getAttribute('href'),
);
console.log(
  'sw registered:',
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await navigator.serviceWorker.ready;
    return Boolean(reg.active || reg.waiting || reg.installing);
  }),
);

// Let the precache settle and the leader art get cached.
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const cached = await page.evaluate(async () => {
  const names = await caches.keys();
  const details: Record<string, number> = {};
  for (const name of names) {
    details[name] = (await (await caches.open(name)).keys()).length;
  }
  return details;
});
console.log('caches:', cached);

const imageOkOnline = await page.evaluate(async () => {
  const img = document.querySelector('img');
  if (!img) return 'no image';
  await img.decode().catch(() => undefined);
  return img.complete && img.naturalWidth > 0;
});
console.log('leader art loaded:', imageOkOnline);

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const offlineHeading = await page.locator('h1').first().innerText();
console.log('offline heading:', offlineHeading);
console.log(
  'offline data present:',
  (await page.locator('main').innerText()).includes('Offline Test'),
);
console.log(
  'offline art loaded:',
  await page.evaluate(async () => {
    const img = document.querySelector('img');
    if (!img) return 'no image';
    await img.decode().catch(() => undefined);
    return img.complete && img.naturalWidth > 0;
  }),
);

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
