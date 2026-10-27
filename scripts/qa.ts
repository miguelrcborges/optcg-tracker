import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:4173/';
const OUT = 'shots/qa';
await mkdir(OUT, { recursive: true });

const now = '2026-10-20T18:00:00.000Z';
const seed = {
  version: 1,
  tournaments: [
    {
      id: 't1',
      name: 'QA Locals',
      date: '2026-10-20',
      format: 'Locals',
      location: 'QA Store',
      leaderId: 'OP01-001',
      notes: 'Seed event for visual QA.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 't2',
      name: 'QA Regional',
      date: '2026-09-12',
      format: 'Regional',
      location: 'Big Venue',
      leaderId: 'OP05-060',
      createdAt: now,
      updatedAt: now,
    },
  ],
  matches: [
    {
      id: 'm1',
      tournamentId: 't1',
      round: 1,
      opponentLeaderId: 'OP01-060',
      opponentName: 'Alice',
      diceWinner: 'me',
      firstPlayer: 'me',
      myGameWins: 2,
      opponentGameWins: 1,
      notes: 'Seed note.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'm2',
      tournamentId: 't1',
      round: 2,
      opponentLeaderId: 'OP02-001',
      opponentName: 'Ben',
      diceWinner: 'opponent',
      firstPlayer: 'opponent',
      myGameWins: 0,
      opponentGameWins: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'm3',
      tournamentId: 't2',
      round: 1,
      opponentLeaderId: 'OP03-099',
      opponentName: 'Cara',
      diceWinner: 'me',
      firstPlayer: 'opponent',
      myGameWins: 1,
      opponentGameWins: 1,
      createdAt: now,
      updatedAt: now,
    },
  ],
  customLeaders: [],
};

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

await page.addInitScript((data) => {
  localStorage.setItem('grand-line-ledger:data:v1', JSON.stringify(data));
}, seed);

async function settle(ms = 550) {
  await page.waitForTimeout(ms);
}

await page.goto(BASE, { waitUntil: 'networkidle' });
await settle();
await page.screenshot({ path: `${OUT}/01-list-viewport.png` });

await page.getByRole('link', { name: /QA Locals/i }).first().click();
await page.waitForURL(/tournaments\/t1/);
await settle();
await page.screenshot({ path: `${OUT}/02-event-viewport.png` });
await page.screenshot({ path: `${OUT}/02-event-full.png`, fullPage: true });

await page.getByRole('link', { name: /Add (match|round)/i }).first().click();
await page.waitForURL(/matches\/new/);
await settle();
await page.screenshot({ path: `${OUT}/03-match-form-viewport.png` });
await page.screenshot({ path: `${OUT}/03-match-form-full.png`, fullPage: true });

// Required field validation.
await page.getByRole('button', { name: /Save round/i }).click();
await settle(150);
console.log(
  'validation messages:',
  await page.getByText(/Choose your opponent|Who won the dice|Who played first/i).count(),
);
await page.screenshot({ path: `${OUT}/04-match-validation.png` });

await page.getByRole('button', { name: /Choose a leader/i }).click();
await page.getByRole('dialog').getByLabel('Search leaders').pressSequentially('Kaido', { delay: 40 });
console.log(
  'search focus retained:',
  await page.getByRole('dialog').getByLabel('Search leaders').evaluate((el) => el === document.activeElement),
);
await page.getByRole('dialog').getByRole('button', { name: /Kaido/ }).first().click();
await page.getByRole('group', { name: 'Who won the dice?' }).getByRole('button', { name: 'Opponent', exact: true }).click();
console.log(
  'first auto-follows dice:',
  (await page.getByRole('group', { name: 'Who played first?' }).getByRole('button', { name: 'Opponent', exact: true }).getAttribute('aria-pressed')) === 'true',
);
await page.getByRole('group', { name: 'Who played first?' }).getByRole('button', { name: 'Me', exact: true }).click();
await page.getByRole('group', { name: 'Who won the dice?' }).getByRole('button', { name: 'Me', exact: true }).click();
console.log(
  'first stays manual:',
  (await page.getByRole('group', { name: 'Who played first?' }).getByRole('button', { name: 'Me', exact: true }).getAttribute('aria-pressed')) === 'true',
);
await page.getByRole('button', { name: '2–1', exact: true }).click();
await page.getByLabel('Opponent name').fill('Dana');
await page.getByLabel('Match notes').fill('QA match note.');
await page.screenshot({ path: `${OUT}/05-match-form-filled.png` });
await page.getByRole('button', { name: /Save round/i }).click();
await page.waitForURL(/tournaments\/t1/);
await settle();
console.log(
  'record after add:',
  (await page.locator('main').innerText()).includes('2–1'),
);
await page.screenshot({ path: `${OUT}/06-event-after-add.png` });

// Save & add another should leave a reset form ready for the next round.
await page.getByRole('link', { name: /Add (match|round)/i }).first().click();
await page.waitForURL(/matches\/new/);
await settle(200);
await page.getByRole('button', { name: /Choose a leader/i }).click();
await page.getByRole('dialog').getByLabel('Search leaders').fill('Charlotte Linlin');
await page.getByRole('dialog').getByRole('button', { name: /Charlotte Linlin/ }).first().click();
await page.getByRole('group', { name: 'Who won the dice?' }).getByRole('button', { name: 'Me', exact: true }).click();
await page.getByRole('button', { name: '2–0', exact: true }).click();
await page.getByRole('button', { name: /Save & add another/i }).click();
await settle(200);
const resetText = await page.locator('main').innerText();
console.log(
  'reset form:',
  resetText.includes('Choose a leader') &&
    (await page.getByLabel('Round').inputValue()) === '5' &&
    resetText.includes('Save round'),
);
await page.screenshot({ path: `${OUT}/07-match-reset.png` });

// Edit the second round and change its score.
await page.getByRole('link', { name: /Back to event/i }).click();
await page.waitForURL(/tournaments\/t1$/);
await settle();
await page.locator('a[href*="/matches/m2/edit"]').click();
await page.waitForURL(/matches\/m2\/edit/);
await settle();
console.log(
  'edit prefill:',
  (await page.getByLabel('Round').inputValue()) === '2' &&
    (await page.getByLabel('Match notes').inputValue()) === '',
);
await page.getByRole('button', { name: '1–2', exact: true }).click();
await page.getByLabel('Match notes').fill('Edited QA note.');
await page.screenshot({ path: `${OUT}/08-match-edit.png` });
await page.getByRole('button', { name: /Save changes/i }).click();
await page.waitForURL(/tournaments\/t1/);
await settle();
console.log(
  'edit saved:',
  (await page.locator('main').innerText()).includes('Edited QA note.'),
);

// Add a custom leader and select it.
await page.getByRole('link', { name: /Add (match|round)/i }).first().click();
await page.waitForURL(/matches\/new/);
await settle(200);
await page.getByRole('button', { name: /Choose a leader/i }).click();
await page.getByRole('dialog').getByLabel('Search leaders').fill('Imu Test Leader');
await page.getByRole('dialog').getByRole('button', { name: /Add custom leader/i }).click();
await page.getByLabel('Leader name').fill('Imu Test Leader');
await page.getByRole('dialog').getByRole('button', { name: 'Blue', exact: true }).click();
await settle(250);
console.log(
  'custom colors:',
  (await page.getByRole('dialog').getByRole('button', { name: 'Red', exact: true }).getAttribute('aria-pressed')) === 'true' &&
    (await page.getByRole('dialog').getByRole('button', { name: 'Blue', exact: true }).getAttribute('aria-pressed')) === 'true',
);
await page.screenshot({ path: `${OUT}/09-custom-leader.png` });
await page.getByRole('button', { name: /Add & select/i }).click();
await settle();
console.log(
  'custom leader selected:',
  (await page.locator('main').innerText()).includes('Imu Test Leader'),
);

await page.goto(`${BASE}#/stats`);
await settle();
await page.screenshot({ path: `${OUT}/10-stats-viewport.png` });
await page.screenshot({ path: `${OUT}/10-stats-full.png`, fullPage: true });

await page.goto(`${BASE}#/data`);
await settle();
await page.screenshot({ path: `${OUT}/11-data-viewport.png` });

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const desktopPage = await desktop.newPage();
await desktopPage.addInitScript((data) => {
  localStorage.setItem('grand-line-ledger:data:v1', JSON.stringify(data));
}, seed);
await desktopPage.goto(BASE, { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(600);
await desktopPage.screenshot({ path: `${OUT}/12-list-desktop.png`, fullPage: true });
await desktopPage.getByRole('link', { name: /QA Locals/i }).first().click();
await desktopPage.waitForURL(/tournaments\/t1/);
await desktopPage.getByRole('heading', { name: 'QA Locals' }).waitFor();
await desktopPage.waitForTimeout(600);
await desktopPage.screenshot({ path: `${OUT}/13-event-desktop.png`, fullPage: true });
await desktopPage.goto(`${BASE}#/stats`);
await desktopPage.waitForTimeout(600);
await desktopPage.screenshot({ path: `${OUT}/14-stats-desktop.png`, fullPage: true });

console.log('errors:', errors.length ? errors : 'none');
await browser.close();
