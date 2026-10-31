import { chromium, type Page } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:4173/';
const OUT = 'shots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

const errors: string[] = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

async function settle(target: Page = page, ms = 650) {
  await target.waitForTimeout(ms);
  await target.waitForLoadState('networkidle').catch(() => undefined);
}

async function shot(name: string, fullPage = false) {
  await settle();
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await shot('01-empty-mobile', true);
console.log('empty heading:', await page.locator('h1').first().innerText());

await page.getByRole('link', { name: /Create your first tournament/i }).click();
await page.waitForURL(/tournaments\/new/);
await shot('02-new-event-mobile', true);

await page.getByLabel('Event name').fill('Friday Night Locals');
await page.getByLabel('Format').fill('Locals');
await page.getByLabel('Location').fill('Grand Line Games');
await page.getByRole('button', { name: /Choose a leader/i }).click();
await page.getByRole('dialog').waitFor();
await page.getByLabel('Search leaders').fill('Monkey D. Luffy');
await settle();
await page.screenshot({ path: `${OUT}/03-leader-picker-mobile.png`, fullPage: true });
await page.getByRole('dialog').getByRole('button', { name: /Monkey D\. Luffy/ }).first().click();
await page.getByRole('button', { name: /Create tournament/i }).click();
await page.waitForURL(/tournaments\/[0-9a-f-]+$/);
await shot('04-event-empty-mobile', true);
console.log('event heading:', await page.locator('h1').first().innerText());

async function addMatch(options: {
  opponent: string;
  score: string;
  dice: 'Me' | 'Opponent';
  first?: 'Me' | 'Opponent';
  opponentName?: string;
  notes?: string;
  saveAnother?: boolean;
  alreadyOnForm?: boolean;
}) {
  if (!options.alreadyOnForm) {
    await page.getByRole('link', { name: /Add (match|round)|Add first match/i }).first().click();
    await page.waitForURL(/matches\/new/);
    await settle(page, 400);
  }
  if (options.opponentName) {
    await page.getByLabel('Opponent name').fill(options.opponentName);
  }
  await page.getByRole('button', { name: /Choose a leader/i }).click();
  await page.getByRole('dialog').getByLabel('Search leaders').fill(options.opponent);
  await page
    .getByRole('dialog')
    .getByRole('button', {
      name: new RegExp(options.opponent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    })
    .first()
    .click();
  await page
    .getByRole('group', { name: 'Who won the dice?' })
    .getByRole('button', { name: options.dice, exact: true })
    .click();
  if (options.first) {
    await page
      .getByRole('group', { name: 'Who played first?' })
      .getByRole('button', { name: options.first, exact: true })
      .click();
  }
  await page.getByRole('button', { name: options.score, exact: true }).click();
  if (options.notes) await page.getByLabel('Match notes').fill(options.notes);
  if (options.saveAnother) {
    await page.getByRole('button', { name: /Save & add another/i }).click();
  } else {
    await page.getByRole('button', { name: /Save round/i }).click();
    await page.waitForURL(/tournaments\/[0-9a-f-]+$/);
  }
  await settle();
}

await addMatch({
  opponent: 'Roronoa Zoro',
  score: '2–1',
  dice: 'Me',
  opponentName: 'Alice',
  notes: 'Close game, won the last roll.',
});
await shot('05-event-one-match-mobile', true);

await addMatch({
  opponent: 'Kaido',
  score: '0–2',
  dice: 'Opponent',
  opponentName: 'Ben',
  saveAnother: true,
});
console.log('after add another URL:', page.url());
await shot('06-match-form-reset-mobile');

await addMatch({
  opponent: 'Charlotte Katakuri',
  score: '2–0',
  dice: 'Opponent',
  first: 'Me',
  opponentName: 'Cara',
  notes: 'Went first after losing the dice.',
  alreadyOnForm: true,
});
await shot('07-event-three-matches-mobile', true);

// Log a bye: no opponent, dice, or score needed.
await page.getByRole('link', { name: /Add (match|round)|Add first match/i }).first().click();
await page.waitForURL(/matches\/new/);
await settle(page, 400);
await page.getByRole('button', { name: /Bye win/i }).click();
console.log(
  'bye hides match fields:',
  (await page.getByLabel('Opponent name').count()) === 0 &&
    (await page.getByRole('button', { name: /Choose a leader/i }).count()) === 0,
);
await page.getByRole('button', { name: /Save round/i }).click();
await page.waitForURL(/tournaments\/[0-9a-f-]+$/);
await settle();
const byeText = await page.locator('main').innerText();
console.log('bye logged:', byeText.includes('Bye') && byeText.includes('4 rounds'));
await shot('07b-event-with-bye-mobile', true);

const eventText = await page.locator('main').innerText();
console.log('event summary snippet:', eventText.slice(0, 400));

await page.getByRole('link', { name: 'Stats', exact: true }).click();
await page.waitForURL(/stats/);
await shot('08-stats-mobile', true);
const statsText = await page.locator('main').innerText();
console.log('stats has 75%:', statsText.includes('75%'));

await page.reload({ waitUntil: 'networkidle' });
await settle();
const reloadedText = await page.locator('main').innerText();
console.log('persisted after reload:', reloadedText.includes('75%'));

await page.getByRole('link', { name: 'Data', exact: true }).click();
await page.waitForURL(/data/);
await shot('09-data-mobile', true);

const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: /Download JSON/i }).click();
const download = await downloadPromise;
console.log('download:', download.suggestedFilename());
const downloadPath = await download.path();
const backupText = downloadPath ? await readFile(downloadPath, 'utf8') : '';
const parsed = JSON.parse(backupText);
console.log('backup counts:', parsed.data.tournaments.length, parsed.data.matches.length);

// Clear, then restore from the exported file, to exercise both flows.
await page.getByRole('button', { name: /Clear all data/i }).click();
await page.getByRole('dialog').getByRole('button', { name: /Clear everything/i }).click();
await settle();
console.log('after clear rounds card:', (await page.locator('main').innerText()).includes('0\nROUNDS'));

await page.locator('input[type=file]').setInputFiles({
  name: 'backup.json',
  mimeType: 'application/json',
  buffer: Buffer.from(backupText),
});
await page.getByRole('dialog').getByRole('button', { name: /Replace & import/i }).click();
await settle();
const restoredText = await page.locator('main').innerText();
console.log('restored rounds:', restoredText.includes('4\nROUNDS'));

await page.getByRole('link', { name: 'Tournaments', exact: true }).click();
await page.waitForURL(/#\/$|#\/$/);
await shot('10-list-mobile', true);

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const desktopPage = await desktop.newPage();
await desktopPage.goto(BASE, { waitUntil: 'networkidle' });
const snapshot = await page.evaluate(() =>
  localStorage.getItem('grand-line-ledger:data:v1'),
);
await desktopPage.evaluate((value) => {
  if (value) localStorage.setItem('grand-line-ledger:data:v1', value);
}, snapshot);
await desktopPage.reload({ waitUntil: 'networkidle' });
await settle(desktopPage);
await desktopPage.screenshot({ path: `${OUT}/11-list-desktop.png`, fullPage: true });
await desktopPage.getByRole('link', { name: /Friday Night Locals/i }).first().click();
await desktopPage.waitForURL(/tournaments\//);
await desktopPage.getByRole('heading', { name: 'Friday Night Locals' }).waitFor();
await settle(desktopPage);
await desktopPage.screenshot({ path: `${OUT}/12-event-desktop.png`, fullPage: true });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
